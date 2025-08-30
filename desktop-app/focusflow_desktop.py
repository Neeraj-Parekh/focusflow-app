#!/usr/bin/env python3
"""
FocusFlow Desktop - Python Qt Desktop Companion App
A powerful desktop companion for the FocusFlow PWA with native features
"""

import sys
import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QLineEdit, QTextEdit, QComboBox, QSpinBox,
    QCheckBox, QListWidget, QListWidgetItem, QTabWidget, QGroupBox,
    QProgressBar, QSystemTrayIcon, QMenu, QAction, QMessageBox,
    QDialog, QFormLayout, QDateEdit, QTimeEdit, QSplitter, QFrame,
    QScrollArea, QGridLayout, QTableWidget, QTableWidgetItem,
    QHeaderView, QStatusBar, QToolBar, QSlider
)
from PyQt5.QtCore import (
    QTimer, QThread, pyqtSignal, QSystemSemaphore, QSharedMemory,
    Qt, QDateTime, QDate, QTime, QSettings, QUrl
)
from PyQt5.QtGui import (
    QIcon, QPixmap, QFont, QColor, QPalette, QDesktopServices,
    QKeySequence, QStandardItemModel, QStandardItem
)

class TimerThread(QThread):
    """Background thread for timer functionality"""
    update_signal = pyqtSignal(int)
    finished_signal = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.time_left = 0
        self.running = False
        self.paused = False
    
    def set_time(self, seconds):
        self.time_left = seconds
    
    def start_timer(self):
        self.running = True
        self.paused = False
        self.start()
    
    def pause_timer(self):
        self.paused = True
    
    def resume_timer(self):
        self.paused = False
    
    def stop_timer(self):
        self.running = False
        self.paused = False
        self.wait()
    
    def run(self):
        while self.running and self.time_left > 0:
            if not self.paused:
                self.update_signal.emit(self.time_left)
                self.time_left -= 1
            time.sleep(1)
        
        if self.time_left <= 0:
            self.finished_signal.emit()
        
        self.running = False

class TaskDialog(QDialog):
    """Dialog for adding/editing tasks"""
    
    def __init__(self, parent=None, task=None):
        super().__init__(parent)
        self.task = task
        self.setup_ui()
        if task:
            self.load_task_data()
    
    def setup_ui(self):
        self.setWindowTitle("Add Task" if not self.task else "Edit Task")
        self.setModal(True)
        self.resize(400, 500)
        
        layout = QFormLayout()
        
        self.title_edit = QLineEdit()
        self.title_edit.setPlaceholderText("Enter task title...")
        layout.addRow("Title:", self.title_edit)
        
        self.description_edit = QTextEdit()
        self.description_edit.setMaximumHeight(100)
        self.description_edit.setPlaceholderText("Task description (optional)...")
        layout.addRow("Description:", self.description_edit)
        
        self.project_combo = QComboBox()
        self.project_combo.setEditable(True)
        self.project_combo.addItems(["", "Work", "Personal", "Study", "Health", "Learning"])
        layout.addRow("Project:", self.project_combo)
        
        self.priority_combo = QComboBox()
        self.priority_combo.addItems(["Low", "Medium", "High", "Critical"])
        self.priority_combo.setCurrentText("Medium")
        layout.addRow("Priority:", self.priority_combo)
        
        self.due_date = QDateEdit()
        self.due_date.setDate(QDate.currentDate().addDays(1))
        self.due_date.setCalendarPopup(True)
        layout.addRow("Due Date:", self.due_date)
        
        self.estimated_pomodoros = QSpinBox()
        self.estimated_pomodoros.setRange(1, 20)
        self.estimated_pomodoros.setValue(1)
        layout.addRow("Estimated Pomodoros:", self.estimated_pomodoros)
        
        self.tags_edit = QLineEdit()
        self.tags_edit.setPlaceholderText("Tags (comma-separated)...")
        layout.addRow("Tags:", self.tags_edit)
        
        # Buttons
        button_layout = QHBoxLayout()
        self.save_btn = QPushButton("Save")
        self.cancel_btn = QPushButton("Cancel")
        
        self.save_btn.clicked.connect(self.accept)
        self.cancel_btn.clicked.connect(self.reject)
        
        button_layout.addWidget(self.cancel_btn)
        button_layout.addWidget(self.save_btn)
        
        layout.addRow(button_layout)
        self.setLayout(layout)
    
    def load_task_data(self):
        if self.task:
            self.title_edit.setText(self.task.get('title', ''))
            self.description_edit.setText(self.task.get('description', ''))
            self.project_combo.setCurrentText(self.task.get('project', ''))
            self.priority_combo.setCurrentText(self.task.get('priority', 'Medium'))
            
            if 'due_date' in self.task:
                due_date = QDate.fromString(self.task['due_date'], Qt.ISODate)
                self.due_date.setDate(due_date)
            
            self.estimated_pomodoros.setValue(self.task.get('estimated_pomodoros', 1))
            self.tags_edit.setText(', '.join(self.task.get('tags', [])))
    
    def get_task_data(self):
        tags = [tag.strip() for tag in self.tags_edit.text().split(',') if tag.strip()]
        
        return {
            'id': self.task.get('id', int(time.time() * 1000)) if self.task else int(time.time() * 1000),
            'title': self.title_edit.text(),
            'description': self.description_edit.toPlainText(),
            'project': self.project_combo.currentText(),
            'priority': self.priority_combo.currentText(),
            'due_date': self.due_date.date().toString(Qt.ISODate),
            'estimated_pomodoros': self.estimated_pomodoros.value(),
            'tags': tags,
            'completed': self.task.get('completed', False) if self.task else False,
            'created_at': self.task.get('created_at', datetime.now().isoformat()) if self.task else datetime.now().isoformat(),
            'pomodoros_completed': self.task.get('pomodoros_completed', 0) if self.task else 0
        }

class SettingsDialog(QDialog):
    """Settings dialog"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.settings = QSettings('FocusFlow', 'Desktop')
        self.setup_ui()
        self.load_settings()
    
    def setup_ui(self):
        self.setWindowTitle("Settings")
        self.setModal(True)
        self.resize(400, 300)
        
        layout = QVBoxLayout()
        
        # Timer Settings
        timer_group = QGroupBox("Timer Settings")
        timer_layout = QFormLayout()
        
        self.pomodoro_spin = QSpinBox()
        self.pomodoro_spin.setRange(1, 60)
        self.pomodoro_spin.setValue(25)
        timer_layout.addRow("Pomodoro (minutes):", self.pomodoro_spin)
        
        self.short_break_spin = QSpinBox()
        self.short_break_spin.setRange(1, 30)
        self.short_break_spin.setValue(5)
        timer_layout.addRow("Short Break (minutes):", self.short_break_spin)
        
        self.long_break_spin = QSpinBox()
        self.long_break_spin.setRange(1, 60)
        self.long_break_spin.setValue(15)
        timer_layout.addRow("Long Break (minutes):", self.long_break_spin)
        
        timer_group.setLayout(timer_layout)
        layout.addWidget(timer_group)
        
        # Notification Settings
        notif_group = QGroupBox("Notifications")
        notif_layout = QVBoxLayout()
        
        self.desktop_notif_check = QCheckBox("Desktop Notifications")
        self.desktop_notif_check.setChecked(True)
        notif_layout.addWidget(self.desktop_notif_check)
        
        self.sound_notif_check = QCheckBox("Sound Notifications")
        self.sound_notif_check.setChecked(True)
        notif_layout.addWidget(self.sound_notif_check)
        
        self.auto_start_breaks_check = QCheckBox("Auto-start Breaks")
        notif_layout.addWidget(self.auto_start_breaks_check)
        
        self.auto_start_pomodoros_check = QCheckBox("Auto-start Pomodoros")
        notif_layout.addWidget(self.auto_start_pomodoros_check)
        
        notif_group.setLayout(notif_layout)
        layout.addWidget(notif_group)
        
        # App Settings
        app_group = QGroupBox("Application")
        app_layout = QVBoxLayout()
        
        self.minimize_to_tray_check = QCheckBox("Minimize to System Tray")
        self.minimize_to_tray_check.setChecked(True)
        app_layout.addWidget(self.minimize_to_tray_check)
        
        self.start_minimized_check = QCheckBox("Start Minimized")
        app_layout.addWidget(self.start_minimized_check)
        
        app_group.setLayout(app_layout)
        layout.addWidget(app_group)
        
        # Buttons
        button_layout = QHBoxLayout()
        self.save_btn = QPushButton("Save")
        self.cancel_btn = QPushButton("Cancel")
        
        self.save_btn.clicked.connect(self.save_settings)
        self.cancel_btn.clicked.connect(self.reject)
        
        button_layout.addWidget(self.cancel_btn)
        button_layout.addWidget(self.save_btn)
        
        layout.addLayout(button_layout)
        self.setLayout(layout)
    
    def load_settings(self):
        self.pomodoro_spin.setValue(self.settings.value('pomodoro_time', 25, int))
        self.short_break_spin.setValue(self.settings.value('short_break_time', 5, int))
        self.long_break_spin.setValue(self.settings.value('long_break_time', 15, int))
        self.desktop_notif_check.setChecked(self.settings.value('desktop_notifications', True, bool))
        self.sound_notif_check.setChecked(self.settings.value('sound_notifications', True, bool))
        self.auto_start_breaks_check.setChecked(self.settings.value('auto_start_breaks', False, bool))
        self.auto_start_pomodoros_check.setChecked(self.settings.value('auto_start_pomodoros', False, bool))
        self.minimize_to_tray_check.setChecked(self.settings.value('minimize_to_tray', True, bool))
        self.start_minimized_check.setChecked(self.settings.value('start_minimized', False, bool))
    
    def save_settings(self):
        self.settings.setValue('pomodoro_time', self.pomodoro_spin.value())
        self.settings.setValue('short_break_time', self.short_break_spin.value())
        self.settings.setValue('long_break_time', self.long_break_spin.value())
        self.settings.setValue('desktop_notifications', self.desktop_notif_check.isChecked())
        self.settings.setValue('sound_notifications', self.sound_notif_check.isChecked())
        self.settings.setValue('auto_start_breaks', self.auto_start_breaks_check.isChecked())
        self.settings.setValue('auto_start_pomodoros', self.auto_start_pomodoros_check.isChecked())
        self.settings.setValue('minimize_to_tray', self.minimize_to_tray_check.isChecked())
        self.settings.setValue('start_minimized', self.start_minimized_check.isChecked())
        self.accept()

class FocusFlowDesktop(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.settings = QSettings('FocusFlow', 'Desktop')
        self.timer_thread = TimerThread()
        self.current_timer_mode = 'pomodoro'
        self.is_running = False
        self.cycles_completed = 0
        
        # Data storage
        self.tasks = []
        self.time_entries = []
        
        self.setup_ui()
        self.setup_system_tray()
        self.setup_timer_connections()
        self.load_data()
        self.apply_settings()
        
        # Auto-save timer
        self.auto_save_timer = QTimer()
        self.auto_save_timer.timeout.connect(self.save_data)
        self.auto_save_timer.start(30000)  # Save every 30 seconds
    
    def setup_ui(self):
        self.setWindowTitle("FocusFlow Desktop")
        self.setGeometry(100, 100, 1000, 700)
        
        # Create central widget and main layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Create tab widget
        self.tab_widget = QTabWidget()
        
        # Timer Tab
        self.setup_timer_tab()
        
        # Tasks Tab
        self.setup_tasks_tab()
        
        # Tracking Tab
        self.setup_tracking_tab()
        
        # Analytics Tab
        self.setup_analytics_tab()
        
        # Main layout
        main_layout = QVBoxLayout()
        main_layout.addWidget(self.tab_widget)
        central_widget.setLayout(main_layout)
        
        # Setup menu bar
        self.setup_menu_bar()
        
        # Setup status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready")
    
    def setup_timer_tab(self):
        timer_widget = QWidget()
        layout = QVBoxLayout()
        
        # Current task section
        current_task_group = QGroupBox("Current Task")
        current_task_layout = QVBoxLayout()
        
        self.current_task_edit = QLineEdit()
        self.current_task_edit.setPlaceholderText("What are you working on?")
        current_task_layout.addWidget(self.current_task_edit)
        
        self.current_project_combo = QComboBox()
        self.current_project_combo.setEditable(True)
        self.current_project_combo.addItems(["", "Work", "Personal", "Study"])
        current_task_layout.addWidget(self.current_project_combo)
        
        current_task_group.setLayout(current_task_layout)
        layout.addWidget(current_task_group)
        
        # Timer display
        timer_group = QGroupBox("Timer")
        timer_layout = QVBoxLayout()
        
        self.timer_display = QLabel("25:00")
        self.timer_display.setAlignment(Qt.AlignCenter)
        font = QFont()
        font.setPointSize(48)
        font.setBold(True)
        self.timer_display.setFont(font)
        timer_layout.addWidget(self.timer_display)
        
        # Timer controls
        controls_layout = QHBoxLayout()
        self.start_btn = QPushButton("Start")
        self.pause_btn = QPushButton("Pause")
        self.reset_btn = QPushButton("Reset")
        
        self.start_btn.clicked.connect(self.start_timer)
        self.pause_btn.clicked.connect(self.pause_timer)
        self.reset_btn.clicked.connect(self.reset_timer)
        
        self.pause_btn.setEnabled(False)
        
        controls_layout.addWidget(self.start_btn)
        controls_layout.addWidget(self.pause_btn)
        controls_layout.addWidget(self.reset_btn)
        timer_layout.addLayout(controls_layout)
        
        # Timer mode buttons
        mode_layout = QHBoxLayout()
        self.pomodoro_btn = QPushButton("Pomodoro")
        self.short_break_btn = QPushButton("Short Break")
        self.long_break_btn = QPushButton("Long Break")
        
        self.pomodoro_btn.clicked.connect(lambda: self.set_timer_mode('pomodoro'))
        self.short_break_btn.clicked.connect(lambda: self.set_timer_mode('short_break'))
        self.long_break_btn.clicked.connect(lambda: self.set_timer_mode('long_break'))
        
        self.pomodoro_btn.setCheckable(True)
        self.short_break_btn.setCheckable(True)
        self.long_break_btn.setCheckable(True)
        self.pomodoro_btn.setChecked(True)
        
        mode_layout.addWidget(self.pomodoro_btn)
        mode_layout.addWidget(self.short_break_btn)
        mode_layout.addWidget(self.long_break_btn)
        timer_layout.addLayout(mode_layout)
        
        timer_group.setLayout(timer_layout)
        layout.addWidget(timer_group)
        
        # Progress section
        progress_group = QGroupBox("Today's Progress")
        progress_layout = QHBoxLayout()
        
        self.cycles_label = QLabel("Cycles: 0")
        self.focus_time_label = QLabel("Focus Time: 0h 0m")
        self.tasks_completed_label = QLabel("Tasks: 0")
        
        progress_layout.addWidget(self.cycles_label)
        progress_layout.addWidget(self.focus_time_label)
        progress_layout.addWidget(self.tasks_completed_label)
        
        progress_group.setLayout(progress_layout)
        layout.addWidget(progress_group)
        
        layout.addStretch()
        timer_widget.setLayout(layout)
        self.tab_widget.addTab(timer_widget, "Timer")
    
    def setup_tasks_tab(self):
        tasks_widget = QWidget()
        layout = QVBoxLayout()
        
        # Tasks header
        header_layout = QHBoxLayout()
        header_layout.addWidget(QLabel("Tasks"))
        header_layout.addStretch()
        
        self.add_task_btn = QPushButton("Add Task")
        self.add_task_btn.clicked.connect(self.add_task)
        header_layout.addWidget(self.add_task_btn)
        
        layout.addLayout(header_layout)
        
        # Filters
        filters_layout = QHBoxLayout()
        
        self.project_filter = QComboBox()
        self.project_filter.addItems(["All Projects", "Work", "Personal", "Study"])
        self.project_filter.currentTextChanged.connect(self.filter_tasks)
        
        self.status_filter = QComboBox()
        self.status_filter.addItems(["All Tasks", "Pending", "Completed"])
        self.status_filter.currentTextChanged.connect(self.filter_tasks)
        
        filters_layout.addWidget(QLabel("Project:"))
        filters_layout.addWidget(self.project_filter)
        filters_layout.addWidget(QLabel("Status:"))
        filters_layout.addWidget(self.status_filter)
        filters_layout.addStretch()
        
        layout.addLayout(filters_layout)
        
        # Tasks list
        self.tasks_list = QListWidget()
        self.tasks_list.itemDoubleClicked.connect(self.edit_task)
        layout.addWidget(self.tasks_list)
        
        tasks_widget.setLayout(layout)
        self.tab_widget.addTab(tasks_widget, "Tasks")
    
    def setup_tracking_tab(self):
        tracking_widget = QWidget()
        layout = QVBoxLayout()
        
        # Manual timer
        manual_group = QGroupBox("Manual Time Tracking")
        manual_layout = QHBoxLayout()
        
        self.manual_task_edit = QLineEdit()
        self.manual_task_edit.setPlaceholderText("Task description...")
        
        self.manual_timer_btn = QPushButton("Start Timer")
        self.manual_timer_btn.clicked.connect(self.toggle_manual_timer)
        
        self.manual_timer_display = QLabel("00:00:00")
        font = QFont()
        font.setPointSize(16)
        font.setBold(True)
        self.manual_timer_display.setFont(font)
        
        manual_layout.addWidget(self.manual_task_edit)
        manual_layout.addWidget(self.manual_timer_btn)
        manual_layout.addWidget(self.manual_timer_display)
        
        manual_group.setLayout(manual_layout)
        layout.addWidget(manual_group)
        
        # Time entries table
        self.time_entries_table = QTableWidget()
        self.time_entries_table.setColumnCount(5)
        self.time_entries_table.setHorizontalHeaderLabels(["Task", "Project", "Duration", "Date", "Type"])
        self.time_entries_table.horizontalHeader().setStretchLastSection(True)
        
        layout.addWidget(QLabel("Recent Time Entries"))
        layout.addWidget(self.time_entries_table)
        
        tracking_widget.setLayout(layout)
        self.tab_widget.addTab(tracking_widget, "Tracking")
        
        # Manual timer
        self.manual_timer = QTimer()
        self.manual_timer.timeout.connect(self.update_manual_timer)
        self.manual_start_time = None
        self.manual_elapsed = 0
    
    def setup_analytics_tab(self):
        analytics_widget = QWidget()
        layout = QVBoxLayout()
        
        # Date range
        date_range_layout = QHBoxLayout()
        date_range_layout.addWidget(QLabel("Date Range:"))
        
        self.start_date_edit = QDateEdit()
        self.start_date_edit.setDate(QDate.currentDate().addDays(-7))
        self.start_date_edit.setCalendarPopup(True)
        
        self.end_date_edit = QDateEdit()
        self.end_date_edit.setDate(QDate.currentDate())
        self.end_date_edit.setCalendarPopup(True)
        
        self.update_analytics_btn = QPushButton("Update")
        self.update_analytics_btn.clicked.connect(self.update_analytics)
        
        date_range_layout.addWidget(self.start_date_edit)
        date_range_layout.addWidget(QLabel("to"))
        date_range_layout.addWidget(self.end_date_edit)
        date_range_layout.addWidget(self.update_analytics_btn)
        date_range_layout.addStretch()
        
        layout.addLayout(date_range_layout)
        
        # Stats grid
        stats_frame = QFrame()
        stats_layout = QGridLayout()
        
        # Create stat cards
        self.total_focus_label = QLabel("0h 0m")
        self.total_cycles_label = QLabel("0")
        self.total_tasks_label = QLabel("0")
        self.avg_session_label = QLabel("0m")
        
        stats_layout.addWidget(QLabel("Total Focus Time:"), 0, 0)
        stats_layout.addWidget(self.total_focus_label, 0, 1)
        stats_layout.addWidget(QLabel("Total Cycles:"), 0, 2)
        stats_layout.addWidget(self.total_cycles_label, 0, 3)
        stats_layout.addWidget(QLabel("Tasks Completed:"), 1, 0)
        stats_layout.addWidget(self.total_tasks_label, 1, 1)
        stats_layout.addWidget(QLabel("Avg Session:"), 1, 2)
        stats_layout.addWidget(self.avg_session_label, 1, 3)
        
        stats_frame.setLayout(stats_layout)
        layout.addWidget(stats_frame)
        
        layout.addStretch()
        analytics_widget.setLayout(layout)
        self.tab_widget.addTab(analytics_widget, "Analytics")
    
    def setup_menu_bar(self):
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu('File')
        
        settings_action = QAction('Settings', self)
        settings_action.setShortcut('Ctrl+,')
        settings_action.triggered.connect(self.open_settings)
        file_menu.addAction(settings_action)
        
        file_menu.addSeparator()
        
        export_action = QAction('Export Data', self)
        export_action.triggered.connect(self.export_data)
        file_menu.addAction(export_action)
        
        import_action = QAction('Import Data', self)
        import_action.triggered.connect(self.import_data)
        file_menu.addAction(import_action)
        
        file_menu.addSeparator()
        
        quit_action = QAction('Quit', self)
        quit_action.setShortcut('Ctrl+Q')
        quit_action.triggered.connect(self.close)
        file_menu.addAction(quit_action)
        
        # Help menu
        help_menu = menubar.addMenu('Help')
        
        about_action = QAction('About', self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def setup_system_tray(self):
        if not QSystemTrayIcon.isSystemTrayAvailable():
            return
        
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(self.style().standardIcon(self.style().SP_ComputerIcon))
        
        # Tray menu
        tray_menu = QMenu()
        
        show_action = QAction("Show", self)
        show_action.triggered.connect(self.show)
        tray_menu.addAction(show_action)
        
        start_action = QAction("Start Timer", self)
        start_action.triggered.connect(self.start_timer)
        tray_menu.addAction(start_action)
        
        pause_action = QAction("Pause Timer", self)
        pause_action.triggered.connect(self.pause_timer)
        tray_menu.addAction(pause_action)
        
        tray_menu.addSeparator()
        
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(self.close)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.tray_icon_activated)
        self.tray_icon.show()
    
    def setup_timer_connections(self):
        self.timer_thread.update_signal.connect(self.update_timer_display)
        self.timer_thread.finished_signal.connect(self.timer_finished)
    
    def tray_icon_activated(self, reason):
        if reason == QSystemTrayIcon.DoubleClick:
            self.show()
            self.raise_()
            self.activateWindow()
    
    def closeEvent(self, event):
        if self.settings.value('minimize_to_tray', True, bool) and self.tray_icon.isVisible():
            self.hide()
            event.ignore()
        else:
            self.save_data()
            event.accept()
    
    # Timer Methods
    def start_timer(self):
        if self.is_running:
            return
        
        self.is_running = True
        self.start_btn.setEnabled(False)
        self.pause_btn.setEnabled(True)
        
        if not self.timer_thread.time_left:
            minutes = self.get_timer_duration()
            self.timer_thread.set_time(minutes * 60)
        
        self.timer_thread.start_timer()
        self.status_bar.showMessage(f"{self.current_timer_mode.title()} timer started")
    
    def pause_timer(self):
        if not self.is_running:
            return
        
        self.timer_thread.pause_timer()
        self.is_running = False
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        self.status_bar.showMessage("Timer paused")
    
    def reset_timer(self):
        self.timer_thread.stop_timer()
        self.is_running = False
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        
        minutes = self.get_timer_duration()
        self.timer_display.setText(f"{minutes:02d}:00")
        self.status_bar.showMessage("Timer reset")
    
    def timer_finished(self):
        self.is_running = False
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        
        if self.current_timer_mode == 'pomodoro':
            self.cycles_completed += 1
            self.cycles_label.setText(f"Cycles: {self.cycles_completed}")
            
            # Record time entry
            if self.current_task_edit.text().strip():
                self.record_time_entry()
        
        # Show notification
        if self.settings.value('desktop_notifications', True, bool):
            message = f"{self.current_timer_mode.title()} completed!"
            self.tray_icon.showMessage("FocusFlow", message, QSystemTrayIcon.Information, 5000)
        
        self.status_bar.showMessage(f"{self.current_timer_mode.title()} completed!")
        self.update_progress_stats()
    
    def set_timer_mode(self, mode):
        self.current_timer_mode = mode
        
        # Update button states
        self.pomodoro_btn.setChecked(mode == 'pomodoro')
        self.short_break_btn.setChecked(mode == 'short_break')
        self.long_break_btn.setChecked(mode == 'long_break')
        
        # Reset timer
        self.reset_timer()
    
    def get_timer_duration(self):
        if self.current_timer_mode == 'pomodoro':
            return self.settings.value('pomodoro_time', 25, int)
        elif self.current_timer_mode == 'short_break':
            return self.settings.value('short_break_time', 5, int)
        elif self.current_timer_mode == 'long_break':
            return self.settings.value('long_break_time', 15, int)
        return 25
    
    def update_timer_display(self, seconds):
        minutes = seconds // 60
        secs = seconds % 60
        self.timer_display.setText(f"{minutes:02d}:{secs:02d}")
        
        # Update window title
        self.setWindowTitle(f"FocusFlow - {minutes:02d}:{secs:02d}")
    
    # Task Management
    def add_task(self):
        dialog = TaskDialog(self)
        if dialog.exec_() == QDialog.Accepted:
            task = dialog.get_task_data()
            self.tasks.append(task)
            self.update_tasks_list()
            self.save_data()
    
    def edit_task(self, item):
        task_id = item.data(Qt.UserRole)
        task = next((t for t in self.tasks if t['id'] == task_id), None)
        if task:
            dialog = TaskDialog(self, task)
            if dialog.exec_() == QDialog.Accepted:
                updated_task = dialog.get_task_data()
                index = next(i for i, t in enumerate(self.tasks) if t['id'] == task_id)
                self.tasks[index] = updated_task
                self.update_tasks_list()
                self.save_data()
    
    def update_tasks_list(self):
        self.tasks_list.clear()
        
        project_filter = self.project_filter.currentText()
        status_filter = self.status_filter.currentText()
        
        for task in self.tasks:
            # Apply filters
            if project_filter != "All Projects" and task.get('project', '') != project_filter:
                continue
            
            if status_filter == "Pending" and task.get('completed', False):
                continue
            elif status_filter == "Completed" and not task.get('completed', False):
                continue
            
            item = QListWidgetItem()
            item.setText(f"[{task['priority']}] {task['title']} ({task.get('project', 'No Project')})")
            item.setData(Qt.UserRole, task['id'])
            
            if task.get('completed', False):
                item.setBackground(QColor(200, 255, 200))
            
            self.tasks_list.addItem(item)
    
    def filter_tasks(self):
        self.update_tasks_list()
    
    # Time Tracking
    def toggle_manual_timer(self):
        if self.manual_timer.isActive():
            self.stop_manual_timer()
        else:
            self.start_manual_timer()
    
    def start_manual_timer(self):
        if not self.manual_task_edit.text().strip():
            QMessageBox.warning(self, "Warning", "Please enter a task description")
            return
        
        self.manual_start_time = datetime.now()
        self.manual_elapsed = 0
        self.manual_timer.start(1000)
        self.manual_timer_btn.setText("Stop Timer")
        
    def stop_manual_timer(self):
        self.manual_timer.stop()
        self.manual_timer_btn.setText("Start Timer")
        
        # Record time entry
        if self.manual_start_time:
            entry = {
                'id': int(time.time() * 1000),
                'description': self.manual_task_edit.text(),
                'project': self.current_project_combo.currentText(),
                'start_time': self.manual_start_time.isoformat(),
                'duration': self.manual_elapsed,
                'type': 'manual'
            }
            self.time_entries.append(entry)
            self.update_time_entries_table()
            self.save_data()
        
        self.manual_task_edit.clear()
        self.manual_elapsed = 0
        self.manual_timer_display.setText("00:00:00")
    
    def update_manual_timer(self):
        self.manual_elapsed += 1
        hours = self.manual_elapsed // 3600
        minutes = (self.manual_elapsed % 3600) // 60
        seconds = self.manual_elapsed % 60
        self.manual_timer_display.setText(f"{hours:02d}:{minutes:02d}:{seconds:02d}")
    
    def record_time_entry(self):
        entry = {
            'id': int(time.time() * 1000),
            'description': self.current_task_edit.text(),
            'project': self.current_project_combo.currentText(),
            'start_time': datetime.now().isoformat(),
            'duration': self.get_timer_duration() * 60,
            'type': 'pomodoro'
        }
        self.time_entries.append(entry)
        self.update_time_entries_table()
    
    def update_time_entries_table(self):
        self.time_entries_table.setRowCount(len(self.time_entries))
        
        for row, entry in enumerate(reversed(self.time_entries[-20:])):  # Show last 20
            self.time_entries_table.setItem(row, 0, QTableWidgetItem(entry['description']))
            self.time_entries_table.setItem(row, 1, QTableWidgetItem(entry.get('project', '')))
            
            duration = entry['duration']
            if isinstance(duration, int):
                hours = duration // 3600
                minutes = (duration % 3600) // 60
                duration_str = f"{hours:02d}:{minutes:02d}"
            else:
                duration_str = str(duration)
            
            self.time_entries_table.setItem(row, 2, QTableWidgetItem(duration_str))
            
            start_time = datetime.fromisoformat(entry['start_time'])
            self.time_entries_table.setItem(row, 3, QTableWidgetItem(start_time.strftime('%Y-%m-%d %H:%M')))
            self.time_entries_table.setItem(row, 4, QTableWidgetItem(entry['type']))
    
    # Analytics
    def update_analytics(self):
        start_date = self.start_date_edit.date().toPyDate()
        end_date = self.end_date_edit.date().toPyDate()
        
        # Filter time entries
        filtered_entries = [
            entry for entry in self.time_entries
            if start_date <= datetime.fromisoformat(entry['start_time']).date() <= end_date
        ]
        
        # Calculate stats
        total_duration = sum(entry['duration'] for entry in filtered_entries)
        total_cycles = len([e for e in filtered_entries if e['type'] == 'pomodoro'])
        
        # Filter completed tasks
        completed_tasks = [
            task for task in self.tasks
            if task.get('completed', False) and task.get('completed_at')
            and start_date <= datetime.fromisoformat(task['completed_at']).date() <= end_date
        ]
        
        # Update labels
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        self.total_focus_label.setText(f"{hours}h {minutes}m")
        self.total_cycles_label.setText(str(total_cycles))
        self.total_tasks_label.setText(str(len(completed_tasks)))
        
        avg_session = total_duration // max(total_cycles, 1) // 60
        self.avg_session_label.setText(f"{avg_session}m")
    
    def update_progress_stats(self):
        today = datetime.now().date()
        today_entries = [
            entry for entry in self.time_entries
            if datetime.fromisoformat(entry['start_time']).date() == today
        ]
        
        total_duration = sum(entry['duration'] for entry in today_entries)
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        
        self.focus_time_label.setText(f"Focus Time: {hours}h {minutes}m")
        
        today_tasks = len([
            task for task in self.tasks
            if task.get('completed', False) and task.get('completed_at')
            and datetime.fromisoformat(task['completed_at']).date() == today
        ])
        
        self.tasks_completed_label.setText(f"Tasks: {today_tasks}")
    
    # Settings
    def open_settings(self):
        dialog = SettingsDialog(self)
        if dialog.exec_() == QDialog.Accepted:
            self.apply_settings()
    
    def apply_settings(self):
        # Update timer display if not running
        if not self.is_running:
            minutes = self.get_timer_duration()
            self.timer_display.setText(f"{minutes:02d}:00")
    
    # Data Management
    def load_data(self):
        try:
            data_file = Path.home() / '.focusflow_desktop.json'
            if data_file.exists():
                with open(data_file, 'r') as f:
                    data = json.load(f)
                    self.tasks = data.get('tasks', [])
                    self.time_entries = data.get('time_entries', [])
                    self.cycles_completed = data.get('cycles_completed', 0)
                    
                self.update_tasks_list()
                self.update_time_entries_table()
                self.update_progress_stats()
                self.cycles_label.setText(f"Cycles: {self.cycles_completed}")
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def save_data(self):
        try:
            data = {
                'tasks': self.tasks,
                'time_entries': self.time_entries,
                'cycles_completed': self.cycles_completed
            }
            
            data_file = Path.home() / '.focusflow_desktop.json'
            with open(data_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def export_data(self):
        # Implementation for data export
        QMessageBox.information(self, "Export", "Export functionality would be implemented here")
    
    def import_data(self):
        # Implementation for data import
        QMessageBox.information(self, "Import", "Import functionality would be implemented here")
    
    def show_about(self):
        QMessageBox.about(self, "About FocusFlow Desktop", 
                         "FocusFlow Desktop v1.0\n\nA powerful Pomodoro timer and task management application.\n\nBuilt with PyQt5")

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("FocusFlow Desktop")
    app.setOrganizationName("FocusFlow")
    
    # Set application icon
    app.setWindowIcon(app.style().standardIcon(app.style().SP_ComputerIcon))
    
    # Check for single instance
    window = FocusFlowDesktop()
    
    # Show window unless start minimized is enabled
    if not window.settings.value('start_minimized', False, bool):
        window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()