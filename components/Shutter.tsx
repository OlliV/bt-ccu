import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconShutterSpeed from '@mui/icons-material/ShutterSpeed';
import Slider from '@mui/material/Slider';
import { useGlobalState } from '../lib/global';
import { useEffect, useState } from 'react';

function valueText(value: number) {
	return `${value} dB`;
}

export default function Shutter() {
	const [cameraControl] = useGlobalState('camera_control');
	const [shutterAngle, setShutterAngle] = useGlobalState('shutter_angle');
	const marks = [
		{
			value: 11.2,
			label: '11.2 deg',
		},
		{
			value: 180,
			label: '180 deg',
		},
		{
			value: 360,
			label: '360 deg',
		}
	];

	useEffect(() => {
		if (cameraControl) {
			cameraControl.setShutterAngle(shutterAngle).catch(console.error);
		}
	}, [cameraControl, shutterAngle]);

	return (
		<Grid item xs={4}>
			<Card variant="outlined">
				<CardHeader
					avatar={<Avatar><IconShutterSpeed /></Avatar>}
					title="Shutter Angle"
				/>
				<CardContent>
					<Slider
						sx={{ ml: 2, width: '80%' }}
						value={shutterAngle}
						disabled={!cameraControl}
						getAriaValueText={valueText}
						aria-labelledby="discrete-slider"
						valueLabelDisplay="auto"
						marks={marks}
						step={2}
						min={marks[0].value}
						max={marks[marks.length - 1].value}
						onChangeCommitted={(_ev: Event, value: number) => setShutterAngle(value)}
					/>
				</CardContent>
			</Card>
		</Grid>
	);
}
