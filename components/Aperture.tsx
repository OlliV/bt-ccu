import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconAperture from '@mui/icons-material/Camera';
import Slider from '@mui/material/Slider';
import { useGlobalState } from '../lib/global';
import { useEffect, useState } from 'react';

function valueText(value: number) {
	return `${value}`;
}

export default function Aperture() {
	const [cameraControl] = useGlobalState('camera_control');
	const [aperture, setAperture] = useGlobalState('aperture');
	const marks = [
		{
			value: 0,
			label: '0',
		},
		{
			value: 1,
			label: 'C',
		}
	];

	useEffect(() => {
		if (cameraControl) {
			cameraControl.setApertureNorm(aperture).catch(console.error);
		}
	}, [cameraControl, aperture]);

	return (
		<Grid item xs={4}>
			<Card variant="outlined">
				<CardHeader
					avatar={<Avatar><IconAperture /></Avatar>}
					title="Aperture"
				/>
				<CardContent>
					<Slider
						sx={{ ml: 2, width: '80%' }}
						value={aperture}
						disabled={!cameraControl}
						getAriaValueText={valueText}
						aria-labelledby="discrete-slider"
						valueLabelDisplay="auto"
						step={0.001}
						marks={marks}
						min={0}
						max={1}
						onChange={(_ev: Event, value: number) => setAperture(value)}
					/>
				</CardContent>
			</Card>
		</Grid>
	);
}
