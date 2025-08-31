from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ...core.database import get_db
from ...models.models import IoTDevice, User
from ...services.iot_service import IoTService
from .auth import get_current_user

router = APIRouter()
iot_service = IoTService()


class IoTDeviceResponse(BaseModel):
    id: str
    device_name: str
    device_type: str
    mac_address: Optional[str]
    ip_address: Optional[str]
    capabilities: List[str]
    is_online: bool
    last_seen: Optional[str]
    firmware_version: Optional[str]
    automation_rules: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class DeviceActionRequest(BaseModel):
    device_id: str
    action: str
    parameters: Dict[str, Any] = {}


class AutomationRuleCreate(BaseModel):
    device_id: str
    trigger_event: str
    action: str
    parameters: Dict[str, Any] = {}
    conditions: Dict[str, Any] = {}


@router.get("/devices", response_model=List[IoTDeviceResponse])
async def get_iot_devices(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get user's IoT devices"""

    devices = db.query(IoTDevice).filter(IoTDevice.user_id == current_user.id).all()
    return [IoTDeviceResponse.from_orm(device) for device in devices]


@router.post("/discover")
async def discover_devices(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Discover IoT devices on the network"""

    try:
        discovered_devices = await iot_service.discover_esp32_devices()

        # Save new devices to database
        for device_info in discovered_devices:
            existing = (
                db.query(IoTDevice)
                .filter(
                    IoTDevice.mac_address == device_info.get("mac_address"),
                    IoTDevice.user_id == current_user.id,
                )
                .first()
            )

            if not existing:
                device = IoTDevice(
                    user_id=current_user.id,
                    device_name=device_info.get("name", "Unknown Device"),
                    device_type=device_info.get("type", "unknown"),
                    mac_address=device_info.get("mac_address"),
                    ip_address=device_info.get("ip_address"),
                    capabilities=device_info.get("capabilities", []),
                    is_online=True,
                    firmware_version=device_info.get("firmware_version"),
                )
                db.add(device)

        db.commit()

        return {
            "discovered_count": len(discovered_devices),
            "devices": discovered_devices,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Device discovery failed: {str(e)}",
        )


@router.post("/devices/{device_id}/action")
async def execute_device_action(
    device_id: str,
    action_request: DeviceActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute an action on an IoT device"""

    device = (
        db.query(IoTDevice)
        .filter(IoTDevice.id == device_id, IoTDevice.user_id == current_user.id)
        .first()
    )

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not device.is_online:
        raise HTTPException(status_code=400, detail="Device is offline")

    try:
        result = await iot_service.execute_device_action(
            device.device_type,
            action_request.action,
            {
                "device_id": device_id,
                "ip_address": device.ip_address,
                **action_request.parameters,
            },
        )

        return {
            "device_id": device_id,
            "action": action_request.action,
            "result": result,
            "timestamp": "2024-01-01T00:00:00Z",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Action execution failed: {str(e)}",
        )


@router.post("/automations")
async def create_automation_rule(
    rule_data: AutomationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an automation rule"""

    device = (
        db.query(IoTDevice)
        .filter(
            IoTDevice.id == rule_data.device_id, IoTDevice.user_id == current_user.id
        )
        .first()
    )

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Add rule to device automation rules
    new_rule = {
        "id": f"rule_{len(device.automation_rules) + 1}",
        "trigger_event": rule_data.trigger_event,
        "action": rule_data.action,
        "parameters": rule_data.parameters,
        "conditions": rule_data.conditions,
        "enabled": True,
        "created_at": "2024-01-01T00:00:00Z",
    }

    if not device.automation_rules:
        device.automation_rules = []

    device.automation_rules.append(new_rule)
    db.commit()

    return {"message": "Automation rule created", "rule": new_rule}


@router.post("/trigger-automation")
async def trigger_automation(
    trigger_event: str,
    context: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user),
):
    """Trigger IoT automation based on productivity events"""

    try:
        result = await iot_service.trigger_automation(
            trigger_event, {"user_id": current_user.id, **context}
        )

        return {
            "trigger_event": trigger_event,
            "actions_executed": result.get("actions_executed", []),
            "devices_affected": result.get("devices_affected", []),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Automation trigger failed: {str(e)}",
        )


@router.get("/environments/presets")
async def get_environment_presets():
    """Get predefined environment presets"""

    presets = [
        {
            "id": "focus_mode",
            "name": "Focus Mode",
            "description": "Optimized lighting and audio for deep focus",
            "actions": [
                {
                    "device_type": "light",
                    "action": "set_brightness",
                    "params": {"brightness": 80},
                },
                {
                    "device_type": "light",
                    "action": "set_color",
                    "params": {"color": "#ffffff"},
                },
                {
                    "device_type": "speaker",
                    "action": "play_ambient",
                    "params": {"sound": "rain"},
                },
                {"device_type": "air_quality", "action": "optimize", "params": {}},
            ],
        },
        {
            "id": "break_mode",
            "name": "Break Mode",
            "description": "Relaxing environment for breaks",
            "actions": [
                {
                    "device_type": "light",
                    "action": "set_brightness",
                    "params": {"brightness": 60},
                },
                {
                    "device_type": "light",
                    "action": "set_color",
                    "params": {"color": "#ffa500"},
                },
                {
                    "device_type": "speaker",
                    "action": "play_ambient",
                    "params": {"sound": "nature"},
                },
            ],
        },
        {
            "id": "meeting_mode",
            "name": "Meeting Mode",
            "description": "Professional lighting for video calls",
            "actions": [
                {
                    "device_type": "light",
                    "action": "set_brightness",
                    "params": {"brightness": 90},
                },
                {
                    "device_type": "light",
                    "action": "set_color",
                    "params": {"color": "#ffffff"},
                },
                {"device_type": "speaker", "action": "mute", "params": {}},
            ],
        },
    ]

    return {"presets": presets}


@router.post("/environments/activate")
async def activate_environment_preset(
    preset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Activate an environment preset"""

    # Get user's devices
    devices = (
        db.query(IoTDevice)
        .filter(IoTDevice.user_id == current_user.id, IoTDevice.is_online == True)
        .all()
    )

    if not devices:
        raise HTTPException(status_code=400, detail="No online devices found")

    try:
        # Mock preset activation
        actions_executed = []

        for device in devices:
            if preset_id == "focus_mode":
                if device.device_type == "light":
                    actions_executed.append(
                        f"Set {device.device_name} brightness to 80%"
                    )
                elif device.device_type == "speaker":
                    actions_executed.append(
                        f"Started ambient sound on {device.device_name}"
                    )
            # ... other presets

        return {
            "preset_id": preset_id,
            "actions_executed": actions_executed,
            "devices_affected": len(devices),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate preset: {str(e)}",
        )


@router.get("/devices/{device_id}/status")
async def get_device_status(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get real-time device status"""

    device = (
        db.query(IoTDevice)
        .filter(IoTDevice.id == device_id, IoTDevice.user_id == current_user.id)
        .first()
    )

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # In a real implementation, this would query the actual device
    mock_status = {
        "device_id": device_id,
        "device_name": device.device_name,
        "online": device.is_online,
        "last_seen": device.last_seen.isoformat() if device.last_seen else None,
        "properties": (
            {"brightness": 75, "color": "#ffffff", "temperature": 22.5, "humidity": 45}
            if device.device_type == "light"
            else (
                {"volume": 50, "playing": False, "current_track": None}
                if device.device_type == "speaker"
                else {}
            )
        ),
    }

    return mock_status
