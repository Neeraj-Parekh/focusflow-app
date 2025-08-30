import asyncio
import aiohttp
import socket
from typing import List, Dict, Any, Optional
import json
import time

class IoTService:
    def __init__(self):
        self.connected_devices = {}
        self.device_states = {}
        self.automation_rules = {}
    
    async def discover_esp32_devices(self, timeout: int = 30) -> List[Dict[str, Any]]:
        """Auto-discover ESP32 devices on the local network"""
        discovered_devices = []
        
        try:
            # Mock discovery - in a real implementation, this would:
            # 1. Scan network for devices advertising specific services
            # 2. Use mDNS/Bonjour to discover ESP32 devices
            # 3. Check for specific HTTP endpoints or MQTT topics
            
            # Simulate network scan
            await asyncio.sleep(2)  # Simulate discovery time
            
            # Mock devices found
            mock_devices = [
                {
                    "name": "FocusFlow Light Strip",
                    "type": "light",
                    "mac_address": "AA:BB:CC:DD:EE:01",
                    "ip_address": "192.168.1.100",
                    "capabilities": ["brightness", "color", "temperature"],
                    "firmware_version": "1.2.3",
                    "model": "ESP32-LED-Strip"
                },
                {
                    "name": "Smart Speaker",
                    "type": "speaker", 
                    "mac_address": "AA:BB:CC:DD:EE:02",
                    "ip_address": "192.168.1.101",
                    "capabilities": ["volume", "play", "pause", "ambient_sounds"],
                    "firmware_version": "2.1.0",
                    "model": "ESP32-Audio"
                },
                {
                    "name": "Air Quality Monitor",
                    "type": "air_quality",
                    "mac_address": "AA:BB:CC:DD:EE:03", 
                    "ip_address": "192.168.1.102",
                    "capabilities": ["temperature", "humidity", "co2", "air_purifier"],
                    "firmware_version": "1.5.2",
                    "model": "ESP32-Environmental"
                }
            ]
            
            discovered_devices = mock_devices
            
            # Update connected devices cache
            for device in discovered_devices:
                self.connected_devices[device["mac_address"]] = device
                self.device_states[device["mac_address"]] = {
                    "online": True,
                    "last_seen": time.time(),
                    "properties": self._get_default_device_state(device["type"])
                }
            
            return discovered_devices
            
        except Exception as e:
            print(f"Device discovery error: {e}")
            return []
    
    def _get_default_device_state(self, device_type: str) -> Dict[str, Any]:
        """Get default state for different device types"""
        defaults = {
            "light": {
                "brightness": 50,
                "color": "#ffffff",
                "temperature": 4000,
                "on": True
            },
            "speaker": {
                "volume": 30,
                "playing": False,
                "current_sound": "none",
                "muted": False
            },
            "air_quality": {
                "temperature": 22.0,
                "humidity": 45,
                "co2": 400,
                "air_purifier_on": False
            }
        }
        return defaults.get(device_type, {})
    
    async def trigger_automation(self, trigger_event: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute IoT automations based on productivity events"""
        executed_actions = []
        affected_devices = []
        
        try:
            # Define automation mappings
            automation_map = {
                "pomodoro_start": [
                    {"device_type": "light", "action": "focus_mode"},
                    {"device_type": "speaker", "action": "play_focus_sound"},
                    {"device_type": "air_quality", "action": "optimize_environment"}
                ],
                "pomodoro_complete": [
                    {"device_type": "light", "action": "celebration_flash"},
                    {"device_type": "speaker", "action": "play_completion_sound"}
                ],
                "break_start": [
                    {"device_type": "light", "action": "break_mode"},
                    {"device_type": "speaker", "action": "play_relaxing_sound"},
                    {"device_type": "air_quality", "action": "refresh_air"}
                ],
                "work_session_end": [
                    {"device_type": "light", "action": "dim_lights"},
                    {"device_type": "speaker", "action": "stop_sounds"}
                ],
                "high_productivity_detected": [
                    {"device_type": "light", "action": "productivity_boost"},
                    {"device_type": "air_quality", "action": "optimize_for_focus"}
                ],
                "break_reminder": [
                    {"device_type": "light", "action": "gentle_reminder_flash"},
                    {"device_type": "speaker", "action": "play_gentle_chime"}
                ]
            }
            
            actions = automation_map.get(trigger_event, [])
            
            for action_config in actions:
                device_type = action_config["device_type"]
                action = action_config["action"]
                
                # Find devices of this type
                matching_devices = [
                    device for device in self.connected_devices.values()
                    if device["type"] == device_type
                ]
                
                for device in matching_devices:
                    try:
                        result = await self.execute_device_action(
                            device_type, 
                            action,
                            {
                                "device_id": device.get("mac_address"),
                                "ip_address": device.get("ip_address"),
                                "context": context
                            }
                        )
                        
                        executed_actions.append({
                            "device": device["name"],
                            "action": action,
                            "result": result
                        })
                        
                        affected_devices.append(device["name"])
                        
                    except Exception as e:
                        print(f"Failed to execute {action} on {device['name']}: {e}")
            
            return {
                "actions_executed": executed_actions,
                "devices_affected": list(set(affected_devices)),
                "trigger_event": trigger_event,
                "timestamp": time.time()
            }
            
        except Exception as e:
            print(f"Automation trigger failed: {e}")
            return {
                "actions_executed": [],
                "devices_affected": [],
                "error": str(e)
            }
    
    async def execute_device_action(self, device_type: str, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Control smart devices based on action type"""
        
        device_id = context.get("device_id")
        ip_address = context.get("ip_address")
        
        if not device_id or not ip_address:
            raise ValueError("Device ID and IP address required")
        
        try:
            # Action mappings for different device types
            if device_type == "light":
                return await self._execute_light_action(action, ip_address, context)
            elif device_type == "speaker":
                return await self._execute_speaker_action(action, ip_address, context)
            elif device_type == "air_quality":
                return await self._execute_air_quality_action(action, ip_address, context)
            else:
                return await self._execute_generic_action(action, ip_address, context)
                
        except Exception as e:
            raise Exception(f"Device action failed: {str(e)}")
    
    async def _execute_light_action(self, action: str, ip_address: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute light-specific actions"""
        
        action_map = {
            "focus_mode": {
                "brightness": 80,
                "color": "#ffffff",
                "temperature": 5000
            },
            "break_mode": {
                "brightness": 60,
                "color": "#ffa500", 
                "temperature": 3000
            },
            "celebration_flash": {
                "effect": "flash",
                "color": "#00ff00",
                "duration": 3
            },
            "productivity_boost": {
                "brightness": 90,
                "color": "#00aaff",
                "temperature": 5500
            },
            "gentle_reminder_flash": {
                "effect": "gentle_pulse",
                "color": "#ffff00",
                "duration": 2
            },
            "dim_lights": {
                "brightness": 20,
                "color": "#ff6600",
                "temperature": 2700
            }
        }
        
        light_config = action_map.get(action, {"brightness": 50})
        
        # In a real implementation, send HTTP request to ESP32
        # await self._send_http_command(ip_address, "/light", light_config)
        
        # Mock implementation
        await asyncio.sleep(0.5)  # Simulate network delay
        
        # Update device state
        device_id = context.get("device_id")
        if device_id in self.device_states:
            self.device_states[device_id]["properties"].update(light_config)
        
        return {
            "status": "success",
            "action": action,
            "config": light_config,
            "device_response": "OK"
        }
    
    async def _execute_speaker_action(self, action: str, ip_address: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute speaker-specific actions"""
        
        action_map = {
            "play_focus_sound": {
                "sound": "white_noise",
                "volume": 40,
                "loop": True
            },
            "play_completion_sound": {
                "sound": "chime",
                "volume": 60,
                "duration": 2
            },
            "play_relaxing_sound": {
                "sound": "nature",
                "volume": 30,
                "loop": True
            },
            "play_gentle_chime": {
                "sound": "soft_bell",
                "volume": 50,
                "duration": 1
            },
            "stop_sounds": {
                "action": "stop",
                "fade_out": True
            }
        }
        
        audio_config = action_map.get(action, {"volume": 30})
        
        # Mock implementation
        await asyncio.sleep(0.3)
        
        device_id = context.get("device_id")
        if device_id in self.device_states:
            self.device_states[device_id]["properties"].update({
                "playing": action != "stop_sounds",
                "current_sound": audio_config.get("sound", "none"),
                "volume": audio_config.get("volume", 30)
            })
        
        return {
            "status": "success",
            "action": action,
            "config": audio_config,
            "device_response": "Audio command executed"
        }
    
    async def _execute_air_quality_action(self, action: str, ip_address: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute air quality device actions"""
        
        action_map = {
            "optimize_environment": {
                "air_purifier": True,
                "target_temperature": 22,
                "target_humidity": 45
            },
            "refresh_air": {
                "air_purifier": True,
                "fan_speed": "high",
                "duration": 300  # 5 minutes
            },
            "optimize_for_focus": {
                "air_purifier": True,
                "target_temperature": 21,
                "target_humidity": 40,
                "co2_alert": True
            }
        }
        
        air_config = action_map.get(action, {"air_purifier": False})
        
        # Mock implementation
        await asyncio.sleep(0.4)
        
        device_id = context.get("device_id")
        if device_id in self.device_states:
            self.device_states[device_id]["properties"].update({
                "air_purifier_on": air_config.get("air_purifier", False),
                "fan_speed": air_config.get("fan_speed", "medium")
            })
        
        return {
            "status": "success", 
            "action": action,
            "config": air_config,
            "device_response": "Environment optimization started"
        }
    
    async def _execute_generic_action(self, action: str, ip_address: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute generic device actions"""
        
        # Fallback for unknown device types
        await asyncio.sleep(0.2)
        
        return {
            "status": "success",
            "action": action,
            "message": f"Generic action {action} executed",
            "device_response": "OK"
        }
    
    async def _send_http_command(self, ip_address: str, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send HTTP command to ESP32 device"""
        
        url = f"http://{ip_address}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data, timeout=5) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        raise Exception(f"HTTP {response.status}: {await response.text()}")
        except asyncio.TimeoutError:
            raise Exception("Device communication timeout")
        except Exception as e:
            raise Exception(f"Communication error: {str(e)}")
    
    def get_device_state(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get current state of a device"""
        return self.device_states.get(device_id)
    
    def is_device_online(self, device_id: str) -> bool:
        """Check if device is online"""
        state = self.device_states.get(device_id)
        if not state:
            return False
        
        # Consider device offline if last seen > 5 minutes ago
        last_seen = state.get("last_seen", 0)
        return (time.time() - last_seen) < 300
    
    async def ping_device(self, ip_address: str) -> bool:
        """Ping device to check connectivity"""
        try:
            # Simple TCP connection test
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(ip_address, 80),
                timeout=3
            )
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False
    
    def add_automation_rule(self, device_id: str, rule: Dict[str, Any]) -> str:
        """Add automation rule for a device"""
        if device_id not in self.automation_rules:
            self.automation_rules[device_id] = []
        
        rule_id = f"rule_{len(self.automation_rules[device_id]) + 1}"
        rule["id"] = rule_id
        rule["created_at"] = time.time()
        rule["enabled"] = True
        
        self.automation_rules[device_id].append(rule)
        
        return rule_id
    
    def remove_automation_rule(self, device_id: str, rule_id: str) -> bool:
        """Remove automation rule"""
        if device_id not in self.automation_rules:
            return False
        
        rules = self.automation_rules[device_id]
        for i, rule in enumerate(rules):
            if rule.get("id") == rule_id:
                del rules[i]
                return True
        
        return False