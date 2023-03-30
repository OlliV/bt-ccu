import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';
import Battery0Icon from '@mui/icons-material/BatteryAlert';
import Battery20Icon from '@mui/icons-material/Battery20';
import Battery30Icon from '@mui/icons-material/Battery30';
import Battery50Icon from '@mui/icons-material/Battery50';
import Battery60Icon from '@mui/icons-material/Battery60';
import Battery80Icon from '@mui/icons-material/Battery80';
import Battery90Icon from '@mui/icons-material/Battery90';
import Battery100Icon from '@mui/icons-material/BatteryFull';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import BatteryCharging30Icon from '@mui/icons-material/BatteryCharging30';
import BatteryCharging50Icon from '@mui/icons-material/BatteryCharging50';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import BatteryCharging80Icon from '@mui/icons-material/BatteryCharging80';
import BatteryCharging90Icon from '@mui/icons-material/BatteryCharging90';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import Tooltip from '@mui/material/Tooltip';
import SxPropsTheme from '../lib/SxPropsTheme';

const style: SxPropsTheme = {
	verticalAlign: 'center',
	fontSize: '25px !important',
};

function BatteryIcon({ batteryLevel }: { batteryLevel: number }) {
	return batteryLevel < 0 ? (
		<BatteryUnknownIcon sx={style} />
	) : batteryLevel < 20 ? (
		<Battery0Icon sx={style} />
	) : batteryLevel < 30 ? (
		<Battery20Icon sx={style} />
	) : batteryLevel < 50 ? (
		<Battery30Icon sx={style} />
	) : batteryLevel < 60 ? (
		<Battery50Icon sx={style} />
	) : batteryLevel < 80 ? (
		<Battery60Icon sx={style} />
	) : batteryLevel < 90 ? (
		<Battery80Icon sx={style} />
	) : batteryLevel < 100 ? (
		<Battery90Icon sx={style} />
	) : (
		<Battery100Icon sx={style} />
	);
}

function BatteryChargingIcon({ batteryLevel }: { batteryLevel: number }) {
	return batteryLevel < 0 ? (
		<BatteryUnknownIcon sx={style} />
	) : batteryLevel < 30 ? (
		<BatteryCharging20Icon sx={style} />
	) : batteryLevel < 50 ? (
		<BatteryCharging30Icon sx={style} />
	) : batteryLevel < 60 ? (
		<BatteryCharging50Icon sx={style} />
	) : batteryLevel < 80 ? (
		<BatteryCharging60Icon sx={style} />
	) : batteryLevel < 90 ? (
		<BatteryCharging80Icon sx={style} />
	) : batteryLevel < 100 ? (
		<BatteryCharging90Icon sx={style} />
	) : (
		<BatteryChargingFullIcon sx={style} />
	);
}

export function BatteryLevel({ batteryLevel, isCharging }: { batteryLevel: number; isCharging?: boolean }) {
	return (
		<Tooltip title={`${batteryLevel} %`} describeChild={true} enterTouchDelay={10}>
			{isCharging ? <BatteryChargingIcon batteryLevel={batteryLevel} /> :
			<BatteryIcon batteryLevel={batteryLevel} />}
		</Tooltip>
	);
}

export function PowerAdapter() {
	return (
		<ElectricalServicesIcon sx={style} />
	);
}
