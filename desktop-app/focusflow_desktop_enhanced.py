#!/usr/bin/env python3
"""
FocusFlow Desktop - Enhanced with Memory Management and Optimizations
A powerful desktop companion for the FocusFlow PWA with native features
"""

import sys
import json
import os
import time
import gc
import weakref
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

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
    Qt, QDateTime, QDate, QTime, QSettings, QUrl, QMutex
)
from PyQt5.QtGui import (
    QIcon, QPixmap, QFont, QColor, QPalette, QDesktopServices,
    QKeySequence, QStandardItemModel, QStandardItem
)


class MemoryOptimizedFocusFlow(QMainWindow):
    """Enhanced FocusFlow with memory management and cleanup"""
    
    def __init__(self):
        super().__init__()
        self.active_timers = weakref.WeakSet()
        self.cleanup_timer = QTimer()
        self.cleanup_timer.timeout.connect(self.cleanup_resources)
        self.cleanup_timer.start(30000)  # Cleanup every 30 seconds
        
        # Fix: Proper logging configuration
        self.setup_logging()
        
        # Fix: Thread-safe operations
        self.worker_thread = None
        self.data_mutex = QMutex()
        
        # Fix: Secure data manager
        self.data_manager = SecureDataManager()
        
        # Initialize UI and data
        self.setup_ui()
        self.load_application_data()
        
    def setup_logging(self):
        """Configure proper logging to prevent console spam"""
        log_file = Path.home() / '.focusflow' / 'focusflow.log'
        log_file.parent.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info("FocusFlow Desktop starting...")
    
    def cleanup_resources(self):
        """Prevent memory leaks by cleaning unused resources"""
        try:
            # Force garbage collection
            gc.collect()
            
            # Clean up completed timers
            completed_timers = [timer for timer in self.active_timers if not timer.isActive()]
            for timer in completed_timers:
                try:
                    timer.deleteLater()
                except:
                    pass
            
            # Log memory usage
            import psutil
            process = psutil.Process(os.getpid())
            memory_mb = process.memory_info().rss / 1024 / 1024
            if memory_mb > 500:  # Warning if over 500MB
                self.logger.warning(f"High memory usage: {memory_mb:.1f}MB")
                
        except Exception as e:
            self.logger.error(f"Cleanup error: {e}")
    
    def start_background_sync(self):
        """Fix: Proper thread management for background operations"""
        if self.worker_thread and self.worker_thread.isRunning():
            self.worker_thread.quit()
            self.worker_thread.wait()
        
        self.worker_thread = BackgroundSyncThread(self.data_manager)
        self.worker_thread.sync_completed.connect(self.on_sync_completed)
        self.worker_thread.start()
    
    def on_sync_completed(self, result):
        """Handle background sync completion"""
        if 'error' in result:
            self.logger.error(f"Sync failed: {result['error']}")
            self.show_notification("Sync Error", result['error'])
        else:
            self.logger.info("Background sync completed successfully")
    
    def closeEvent(self, event):
        """Fix: Proper cleanup on application exit"""
        self.logger.info("Application closing...")
        
        # Stop cleanup timer
        self.cleanup_timer.stop()
        
        # Stop worker thread
        if self.worker_thread and self.worker_thread.isRunning():
            self.worker_thread.quit()
            self.worker_thread.wait(3000)  # Wait up to 3 seconds
        
        # Save all data before closing
        self.save_all_data()
        
        # Clean up system tray
        if hasattr(self, 'tray_icon'):
            self.tray_icon.hide()
        
        event.accept()
        self.logger.info("Application closed successfully")
    
    def setup_ui(self):
        """Initialize the user interface"""
        self.setWindowTitle("FocusFlow Desktop - Enhanced")
        self.setMinimumSize(800, 600)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        
        # Header
        header_layout = QHBoxLayout()
        header_label = QLabel("FocusFlow Desktop")
        header_label.setStyleSheet("font-size: 18px; font-weight: bold; color: #2c3e50;")
        header_layout.addWidget(header_label)
        header_layout.addStretch()
        
        # System tray toggle
        tray_btn = QPushButton("🔸 Minimize to Tray")
        tray_btn.clicked.connect(self.minimize_to_tray)
        header_layout.addWidget(tray_btn)
        
        main_layout.addLayout(header_layout)
        
        # Tab widget for different features
        self.tab_widget = QTabWidget()
        main_layout.addWidget(self.tab_widget)
        
        # Setup tabs
        self.setup_timer_tab()
        self.setup_tasks_tab()
        self.setup_analytics_tab()
        self.setup_settings_tab()
        
        # Setup system tray
        self.setup_system_tray()
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready")
    
    def setup_timer_tab(self):
        """Setup the timer tab with Pomodoro functionality"""
        timer_widget = QWidget()
        layout = QVBoxLayout(timer_widget)
        
        # Timer display
        self.timer_display = QLabel("25:00")
        self.timer_display.setAlignment(Qt.AlignCenter)
        self.timer_display.setStyleSheet("font-size: 48px; font-weight: bold; color: #e74c3c;")
        layout.addWidget(self.timer_display)
        
        # Current task
        task_layout = QHBoxLayout()
        task_layout.addWidget(QLabel("Working on:"))
        self.current_task_input = QLineEdit()
        self.current_task_input.setPlaceholderText("What are you working on?")
        task_layout.addWidget(self.current_task_input)
        layout.addLayout(task_layout)
        
        # Timer controls
        controls_layout = QHBoxLayout()
        self.start_btn = QPushButton("Start")
        self.pause_btn = QPushButton("Pause")
        self.reset_btn = QPushButton("Reset")
        
        self.start_btn.clicked.connect(self.start_timer)
        self.pause_btn.clicked.connect(self.pause_timer)
        self.reset_btn.clicked.connect(self.reset_timer)
        
        controls_layout.addWidget(self.start_btn)
        controls_layout.addWidget(self.pause_btn)
        controls_layout.addWidget(self.reset_btn)
        layout.addLayout(controls_layout)
        
        # Timer presets
        presets_layout = QHBoxLayout()
        presets_layout.addWidget(QLabel("Quick Set:"))
        
        pomodoro_btn = QPushButton("25m Work")
        short_break_btn = QPushButton("5m Break")
        long_break_btn = QPushButton("15m Break")
        
        pomodoro_btn.clicked.connect(lambda: self.set_timer(25 * 60))
        short_break_btn.clicked.connect(lambda: self.set_timer(5 * 60))
        long_break_btn.clicked.connect(lambda: self.set_timer(15 * 60))
        
        presets_layout.addWidget(pomodoro_btn)
        presets_layout.addWidget(short_break_btn)
        presets_layout.addWidget(long_break_btn)
        layout.addLayout(presets_layout)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        layout.addWidget(self.progress_bar)
        
        layout.addStretch()
        
        self.tab_widget.addTab(timer_widget, "Timer")
        
        # Initialize timer
        self.timer_thread = None
        self.timer_duration = 25 * 60  # 25 minutes default
        self.time_remaining = self.timer_duration
        
    def setup_tasks_tab(self):
        """Setup the tasks management tab"""
        tasks_widget = QWidget()
        layout = QVBoxLayout(tasks_widget)
        
        # Add task section
        add_task_layout = QHBoxLayout()
        self.task_input = QLineEdit()
        self.task_input.setPlaceholderText("Enter new task...")
        add_task_btn = QPushButton("Add Task")
        add_task_btn.clicked.connect(self.add_task)
        
        add_task_layout.addWidget(self.task_input)
        add_task_layout.addWidget(add_task_btn)
        layout.addLayout(add_task_layout)
        
        # Tasks list
        self.tasks_list = QListWidget()
        layout.addWidget(self.tasks_list)
        
        # Task controls
        task_controls_layout = QHBoxLayout()
        complete_btn = QPushButton("Complete")
        delete_btn = QPushButton("Delete")
        edit_btn = QPushButton("Edit")
        
        complete_btn.clicked.connect(self.complete_task)
        delete_btn.clicked.connect(self.delete_task)
        edit_btn.clicked.connect(self.edit_task)
        
        task_controls_layout.addWidget(complete_btn)
        task_controls_layout.addWidget(delete_btn)
        task_controls_layout.addWidget(edit_btn)
        layout.addLayout(task_controls_layout)
        
        self.tab_widget.addTab(tasks_widget, "Tasks")
        
        # Initialize tasks data
        self.tasks = []
    
    def setup_analytics_tab(self):
        """Setup the analytics and productivity insights tab"""
        analytics_widget = QWidget()
        layout = QVBoxLayout(analytics_widget)
        
        # Stats overview
        stats_group = QGroupBox("Productivity Stats")
        stats_layout = QGridLayout(stats_group)
        
        self.total_focus_time_label = QLabel("0 minutes")
        self.completed_pomodoros_label = QLabel("0")
        self.tasks_completed_label = QLabel("0")
        self.productivity_score_label = QLabel("0%")
        
        stats_layout.addWidget(QLabel("Total Focus Time:"), 0, 0)
        stats_layout.addWidget(self.total_focus_time_label, 0, 1)
        stats_layout.addWidget(QLabel("Completed Pomodoros:"), 1, 0)
        stats_layout.addWidget(self.completed_pomodoros_label, 1, 1)
        stats_layout.addWidget(QLabel("Tasks Completed:"), 2, 0)
        stats_layout.addWidget(self.tasks_completed_label, 2, 1)
        stats_layout.addWidget(QLabel("Productivity Score:"), 3, 0)
        stats_layout.addWidget(self.productivity_score_label, 3, 1)
        
        layout.addWidget(stats_group)
        
        # Activity insights
        insights_group = QGroupBox("AI Insights")
        insights_layout = QVBoxLayout(insights_group)
        
        self.insights_text = QTextEdit()
        self.insights_text.setReadOnly(True)
        self.insights_text.setPlaceholderText("AI insights will appear here based on your activity patterns...")
        insights_layout.addWidget(self.insights_text)
        
        layout.addWidget(insights_group)
        
        # Refresh button
        refresh_btn = QPushButton("Refresh Analytics")
        refresh_btn.clicked.connect(self.refresh_analytics)
        layout.addWidget(refresh_btn)
        
        self.tab_widget.addTab(analytics_widget, "Analytics")
    
    def setup_settings_tab(self):
        """Setup the settings and preferences tab"""
        settings_widget = QWidget()
        layout = QVBoxLayout(settings_widget)
        
        # Timer settings
        timer_group = QGroupBox("Timer Settings")
        timer_layout = QFormLayout(timer_group)
        
        self.pomodoro_duration = QSpinBox()
        self.pomodoro_duration.setRange(1, 60)
        self.pomodoro_duration.setValue(25)
        self.pomodoro_duration.setSuffix(" minutes")
        
        self.short_break_duration = QSpinBox()
        self.short_break_duration.setRange(1, 30)
        self.short_break_duration.setValue(5)
        self.short_break_duration.setSuffix(" minutes")
        
        self.long_break_duration = QSpinBox()
        self.long_break_duration.setRange(1, 60)
        self.long_break_duration.setValue(15)
        self.long_break_duration.setSuffix(" minutes")
        
        timer_layout.addRow("Pomodoro Duration:", self.pomodoro_duration)
        timer_layout.addRow("Short Break:", self.short_break_duration)
        timer_layout.addRow("Long Break:", self.long_break_duration)
        
        layout.addWidget(timer_group)
        
        # Notification settings
        notification_group = QGroupBox("Notifications")
        notification_layout = QVBoxLayout(notification_group)
        
        self.sound_enabled = QCheckBox("Enable sounds")
        self.sound_enabled.setChecked(True)
        
        self.desktop_notifications = QCheckBox("Enable desktop notifications")
        self.desktop_notifications.setChecked(True)
        
        self.auto_start_breaks = QCheckBox("Auto-start breaks")
        self.auto_start_breaks.setChecked(False)
        
        notification_layout.addWidget(self.sound_enabled)
        notification_layout.addWidget(self.desktop_notifications)
        notification_layout.addWidget(self.auto_start_breaks)
        
        layout.addWidget(notification_group)
        
        # Data management
        data_group = QGroupBox("Data Management")
        data_layout = QVBoxLayout(data_group)
        
        export_btn = QPushButton("Export Data")
        import_btn = QPushButton("Import Data")
        backup_btn = QPushButton("Create Backup")
        
        export_btn.clicked.connect(self.export_data)
        import_btn.clicked.connect(self.import_data)
        backup_btn.clicked.connect(self.create_backup)
        
        data_layout.addWidget(export_btn)
        data_layout.addWidget(import_btn)
        data_layout.addWidget(backup_btn)
        
        layout.addWidget(data_group)
        
        layout.addStretch()
        
        self.tab_widget.addTab(settings_widget, "Settings")
    
    def setup_system_tray(self):
        """Setup system tray functionality"""
        if QSystemTrayIcon.isSystemTrayAvailable():
            self.tray_icon = QSystemTrayIcon()
            self.tray_icon.setIcon(self.style().standardIcon(self.style().SP_ComputerIcon))
            
            # Tray menu
            tray_menu = QMenu()
            
            show_action = QAction("Show FocusFlow", self)
            show_action.triggered.connect(self.show)
            tray_menu.addAction(show_action)
            
            tray_menu.addSeparator()
            
            start_timer_action = QAction("Start Timer", self)
            start_timer_action.triggered.connect(self.start_timer)
            tray_menu.addAction(start_timer_action)
            
            tray_menu.addSeparator()
            
            quit_action = QAction("Quit", self)
            quit_action.triggered.connect(self.close)
            tray_menu.addAction(quit_action)
            
            self.tray_icon.setContextMenu(tray_menu)
            self.tray_icon.show()
            
            # Tray icon click
            self.tray_icon.activated.connect(self.on_tray_activated)
    
    def minimize_to_tray(self):
        """Minimize application to system tray"""
        if QSystemTrayIcon.isSystemTrayAvailable():
            self.hide()
            self.show_notification("FocusFlow", "Application minimized to tray")
    
    def on_tray_activated(self, reason):
        """Handle tray icon activation"""
        if reason == QSystemTrayIcon.DoubleClick:
            self.show()
            self.raise_()
            self.activateWindow()
    
    def show_notification(self, title, message):
        """Show system notification"""
        if hasattr(self, 'tray_icon') and self.desktop_notifications.isChecked():
            self.tray_icon.showMessage(title, message, QSystemTrayIcon.Information, 3000)
    
    # Timer methods
    def start_timer(self):
        """Start the Pomodoro timer"""
        if not self.timer_thread or not self.timer_thread.isRunning():
            self.timer_thread = TimerThread()
            self.timer_thread.update_signal.connect(self.update_timer_display)
            self.timer_thread.finished_signal.connect(self.on_timer_finished)
            self.active_timers.add(self.timer_thread)
        
        self.timer_thread.set_time(self.time_remaining)
        self.timer_thread.start_timer()
        
        self.start_btn.setEnabled(False)
        self.pause_btn.setEnabled(True)
        self.status_bar.showMessage("Timer running...")
    
    def pause_timer(self):
        """Pause the timer"""
        if self.timer_thread:
            if self.timer_thread.paused:
                self.timer_thread.resume_timer()
                self.pause_btn.setText("Pause")
                self.status_bar.showMessage("Timer running...")
            else:
                self.timer_thread.pause_timer()
                self.pause_btn.setText("Resume")
                self.status_bar.showMessage("Timer paused")
    
    def reset_timer(self):
        """Reset the timer"""
        if self.timer_thread:
            self.timer_thread.stop_timer()
        
        self.time_remaining = self.timer_duration
        self.update_timer_display(self.time_remaining)
        self.progress_bar.setValue(0)
        
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        self.pause_btn.setText("Pause")
        self.status_bar.showMessage("Timer reset")
    
    def set_timer(self, duration):
        """Set timer duration in seconds"""
        self.timer_duration = duration
        self.time_remaining = duration
        self.update_timer_display(duration)
        self.progress_bar.setValue(0)
    
    def update_timer_display(self, time_left):
        """Update the timer display"""
        self.time_remaining = time_left
        minutes = time_left // 60
        seconds = time_left % 60
        self.timer_display.setText(f"{minutes:02d}:{seconds:02d}")
        
        # Update progress bar
        progress = ((self.timer_duration - time_left) / self.timer_duration) * 100
        self.progress_bar.setValue(int(progress))
    
    def on_timer_finished(self):
        """Handle timer completion"""
        self.show_notification("FocusFlow", "Timer completed!")
        
        # Play sound if enabled
        if self.sound_enabled.isChecked():
            QApplication.beep()
        
        # Record completed pomodoro
        self.record_completed_pomodoro()
        
        # Reset UI
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        self.pause_btn.setText("Pause")
        self.status_bar.showMessage("Timer completed!")
    
    # Task management methods
    def add_task(self):
        """Add a new task"""
        task_text = self.task_input.text().strip()
        if task_text:
            task = {
                'id': len(self.tasks),
                'text': task_text,
                'completed': False,
                'created_at': datetime.now().isoformat()
            }
            self.tasks.append(task)
            self.update_tasks_list()
            self.task_input.clear()
            self.save_all_data()
    
    def complete_task(self):
        """Mark selected task as completed"""
        current_row = self.tasks_list.currentRow()
        if 0 <= current_row < len(self.tasks):
            self.tasks[current_row]['completed'] = True
            self.tasks[current_row]['completed_at'] = datetime.now().isoformat()
            self.update_tasks_list()
            self.save_all_data()
    
    def delete_task(self):
        """Delete selected task"""
        current_row = self.tasks_list.currentRow()
        if 0 <= current_row < len(self.tasks):
            del self.tasks[current_row]
            self.update_tasks_list()
            self.save_all_data()
    
    def edit_task(self):
        """Edit selected task"""
        current_row = self.tasks_list.currentRow()
        if 0 <= current_row < len(self.tasks):
            # Simple inline editing for now
            current_item = self.tasks_list.currentItem()
            if current_item:
                current_item.setFlags(current_item.flags() | Qt.ItemIsEditable)
                self.tasks_list.editItem(current_item)
    
    def update_tasks_list(self):
        """Update the tasks list display"""
        self.tasks_list.clear()
        for task in self.tasks:
            item_text = task['text']
            if task['completed']:
                item_text = f"✓ {item_text}"
            
            item = QListWidgetItem(item_text)
            if task['completed']:
                item.setForeground(QColor('#666666'))
            
            self.tasks_list.addItem(item)
    
    # Analytics methods
    def refresh_analytics(self):
        """Refresh analytics display"""
        stats = self.calculate_productivity_stats()
        
        self.total_focus_time_label.setText(f"{stats['total_focus_time']} minutes")
        self.completed_pomodoros_label.setText(str(stats['completed_pomodoros']))
        self.tasks_completed_label.setText(str(stats['tasks_completed']))
        self.productivity_score_label.setText(f"{stats['productivity_score']:.1f}%")
        
        # Generate insights
        insights = self.generate_insights(stats)
        self.insights_text.setHtml(insights)
    
    def calculate_productivity_stats(self):
        """Calculate productivity statistics"""
        data = self.data_manager.load_data()
        analytics = data.get('analytics', {})
        
        completed_tasks = len([t for t in self.tasks if t['completed']])
        
        return {
            'total_focus_time': analytics.get('total_focus_time', 0),
            'completed_pomodoros': analytics.get('completed_pomodoros', 0),
            'tasks_completed': completed_tasks,
            'productivity_score': analytics.get('productivity_score', 0)
        }
    
    def generate_insights(self, stats):
        """Generate AI-powered insights"""
        insights = "<h3>Productivity Insights</h3>"
        
        if stats['completed_pomodoros'] == 0:
            insights += "<p>🎯 Start your first Pomodoro session to begin tracking your productivity!</p>"
        elif stats['completed_pomodoros'] < 5:
            insights += "<p>🌱 Great start! Try to complete at least 4-6 Pomodoros per day for optimal productivity.</p>"
        else:
            insights += f"<p>🚀 Excellent! You've completed {stats['completed_pomodoros']} Pomodoro sessions.</p>"
        
        if stats['tasks_completed'] > 0:
            insights += f"<p>✅ You've completed {stats['tasks_completed']} tasks. Keep up the momentum!</p>"
        
        focus_hours = stats['total_focus_time'] / 60
        if focus_hours > 2:
            insights += f"<p>🎯 You've focused for {focus_hours:.1f} hours total. Impressive dedication!</p>"
        
        return insights
    
    def record_completed_pomodoro(self):
        """Record a completed Pomodoro session"""
        with QMutexLocker(self.data_mutex):
            data = self.data_manager.load_data()
            analytics = data.get('analytics', {})
            
            analytics['completed_pomodoros'] = analytics.get('completed_pomodoros', 0) + 1
            analytics['total_focus_time'] = analytics.get('total_focus_time', 0) + (self.timer_duration / 60)
            
            # Update productivity score based on completion
            current_score = analytics.get('productivity_score', 0)
            analytics['productivity_score'] = min(100, current_score + 2.5)
            
            data['analytics'] = analytics
            self.data_manager.save_data(data)
    
    # Data management methods
    def load_application_data(self):
        """Load application data"""
        data = self.data_manager.load_data()
        
        # Load tasks
        self.tasks = data.get('tasks', [])
        self.update_tasks_list()
        
        # Load settings
        settings = data.get('settings', {})
        self.pomodoro_duration.setValue(settings.get('pomodoro_duration', 25))
        self.short_break_duration.setValue(settings.get('short_break', 5))
        self.long_break_duration.setValue(settings.get('long_break', 15))
        self.sound_enabled.setChecked(settings.get('sound_enabled', True))
        self.desktop_notifications.setChecked(settings.get('notifications_enabled', True))
        self.auto_start_breaks.setChecked(settings.get('auto_start_breaks', False))
        
        # Update timer duration
        self.timer_duration = self.pomodoro_duration.value() * 60
        self.time_remaining = self.timer_duration
        self.update_timer_display(self.timer_duration)
    
    def save_all_data(self):
        """Save all application data"""
        with QMutexLocker(self.data_mutex):
            data = self.data_manager.load_data()
            
            # Save tasks
            data['tasks'] = self.tasks
            
            # Save settings
            data['settings'] = {
                'pomodoro_duration': self.pomodoro_duration.value(),
                'short_break': self.short_break_duration.value(),
                'long_break': self.long_break_duration.value(),
                'sound_enabled': self.sound_enabled.isChecked(),
                'notifications_enabled': self.desktop_notifications.isChecked(),
                'auto_start_breaks': self.auto_start_breaks.isChecked()
            }
            
            self.data_manager.save_data(data)
    
    def export_data(self):
        """Export application data"""
        try:
            data = self.data_manager.load_data()
            export_file = Path.home() / f'focusflow_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            
            with open(export_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            QMessageBox.information(self, "Export Successful", f"Data exported to:\n{export_file}")
        except Exception as e:
            self.logger.error(f"Export failed: {e}")
            QMessageBox.critical(self, "Export Failed", f"Failed to export data:\n{str(e)}")
    
    def import_data(self):
        """Import application data"""
        try:
            from PyQt5.QtWidgets import QFileDialog
            
            file_path, _ = QFileDialog.getOpenFileName(
                self, "Import FocusFlow Data", str(Path.home()), "JSON Files (*.json)"
            )
            
            if file_path:
                with open(file_path, 'r') as f:
                    imported_data = json.load(f)
                
                # Validate data structure
                if isinstance(imported_data, dict):
                    self.data_manager.save_data(imported_data)
                    self.load_application_data()
                    QMessageBox.information(self, "Import Successful", "Data imported successfully!")
                else:
                    QMessageBox.warning(self, "Import Failed", "Invalid data format")
                    
        except Exception as e:
            self.logger.error(f"Import failed: {e}")
            QMessageBox.critical(self, "Import Failed", f"Failed to import data:\n{str(e)}")
    
    def create_backup(self):
        """Create a backup of application data"""
        try:
            data = self.data_manager.load_data()
            backup_dir = Path.home() / '.focusflow' / 'backups'
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            backup_file = backup_dir / f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            
            with open(backup_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            QMessageBox.information(self, "Backup Created", f"Backup created:\n{backup_file}")
        except Exception as e:
            self.logger.error(f"Backup failed: {e}")
            QMessageBox.critical(self, "Backup Failed", f"Failed to create backup:\n{str(e)}")


class SecureDataManager:
    """Secure data management with atomic saves and corruption recovery"""
    
    def __init__(self):
        self.data_dir = Path.home() / '.focusflow'
        self.data_dir.mkdir(exist_ok=True)
        self.data_file = self.data_dir / 'focusflow_data.json'
        self.backup_file = self.data_dir / 'focusflow_data.json.backup'
    
    def save_data(self, data):
        """Atomic save with backup to prevent data corruption"""
        try:
            # Create backup first
            if self.data_file.exists():
                shutil.copy2(self.data_file, self.backup_file)
            
            # Write to temporary file first
            temp_file = self.data_file.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Atomic move
            temp_file.replace(self.data_file)
            
            return True
        except Exception as e:
            logging.error(f"Failed to save data: {e}")
            return False
    
    def load_data(self):
        """Load data with corruption recovery"""
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logging.warning(f"Primary data file corrupted: {e}")
            
            # Try backup
            if self.backup_file.exists():
                try:
                    with open(self.backup_file, 'r') as f:
                        logging.info("Restored from backup")
                        return json.load(f)
                except:
                    pass
            
            # Return default data structure
            logging.warning("Starting with fresh data")
            return self.get_default_data()
    
    def get_default_data(self):
        """Default data structure"""
        return {
            "tasks": [],
            "settings": {
                "pomodoro_duration": 25,
                "short_break": 5,
                "long_break": 15,
                "auto_start_breaks": False,
                "sound_enabled": True,
                "notifications_enabled": True
            },
            "analytics": {
                "total_focus_time": 0,
                "completed_pomodoros": 0,
                "tasks_completed": 0,
                "productivity_score": 0
            }
        }


class BackgroundSyncThread(QThread):
    """Background thread for syncing data with web app"""
    sync_completed = pyqtSignal(dict)
    
    def __init__(self, data_manager):
        super().__init__()
        self.data_manager = data_manager
    
    def run(self):
        """Background operations without blocking UI"""
        try:
            # Simulate sync with web app
            # In real implementation, this would sync with the PWA
            result = self.perform_sync()
            self.sync_completed.emit(result)
        except Exception as e:
            self.sync_completed.emit({'error': str(e)})
    
    def perform_sync(self):
        """Perform actual sync operations"""
        # Placeholder for sync logic
        time.sleep(1)  # Simulate network operation
        return {'status': 'success', 'synced_items': 0}


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
        if not self.isRunning():
            self.start()
    
    def pause_timer(self):
        self.paused = True
    
    def resume_timer(self):
        self.paused = False
    
    def stop_timer(self):
        self.running = False
        self.paused = False
        if self.isRunning():
            self.quit()
            self.wait()
    
    def run(self):
        while self.running and self.time_left > 0:
            if not self.paused:
                self.update_signal.emit(self.time_left)
                self.time_left -= 1
            self.msleep(1000)  # Sleep for 1 second
        
        if self.time_left <= 0 and self.running:
            self.finished_signal.emit()
        
        self.running = False


def main():
    """Main application entry point"""
    app = QApplication(sys.argv)
    app.setApplicationName("FocusFlow Desktop")
    app.setApplicationVersion("2.1")
    app.setOrganizationName("FocusFlow")
    
    # Set application icon
    app.setWindowIcon(app.style().standardIcon(app.style().SP_ComputerIcon))
    
    # Check for existing instance
    shared_memory = QSharedMemory("FocusFlowDesktop")
    if not shared_memory.create(1):
        QMessageBox.warning(None, "FocusFlow", "FocusFlow Desktop is already running!")
        sys.exit(1)
    
    # Create and show main window
    window = MemoryOptimizedFocusFlow()
    window.show()
    
    try:
        sys.exit(app.exec_())
    except SystemExit:
        pass
    finally:
        # Cleanup
        shared_memory.detach()


if __name__ == "__main__":
    main()