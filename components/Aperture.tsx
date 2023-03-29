import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconAperture from '@mui/icons-material/Camera';
import InputAdornment from '@mui/material/InputAdornment';
import MuiInput from '@mui/material/OutlinedInput';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useGlobalState } from '../lib/global';
import { BCSParam } from '../lib/ble/bcs';

function valueText(value: number) {
	return `${value}`;
}

const Input = styled(MuiInput)`
	width: 5em;
`;

export default function Aperture() {
	const [cameraControl] = useGlobalState('camera_control');
	const [aperture, setAperture] = useGlobalState('aperture');
	const [apertureF, setApertureF] = useState(1.4);
	const marks = [
		{
			value: 0,
			label: '0',
		},
		{
			value: 1,
			label: 'C',
		},
	];

	useEffect(() => {
		const cb = (av: number) => {
			setApertureF(Math.sqrt(Math.pow(2, av)));
		};

		if (cameraControl) {
			cameraControl.addParamListener(BCSParam.Aperture, cb);
			return () => cameraControl.removeParamListener(BCSParam.Aperture, cb);
		}
	}, [cameraControl]);

	useEffect(() => {
		if (cameraControl) {
			cameraControl.setApertureNorm(aperture).catch(console.error);
		}
	}, [cameraControl, aperture]);

	return (
		<Grid item xs={3}>
			<Card variant="outlined">
				<CardHeader
					avatar={
						<Avatar>
							<IconAperture />
						</Avatar>
					}
					title="Aperture"
				/>
				<CardContent>
					<Stack sx={{ height: 300 }} spacing={1} direction="row">
						<Input
							value={`${apertureF.toFixed(2)}`}
							disabled={true}
							size="small"
							startAdornment={<InputAdornment position="start">f</InputAdornment>}
							inputProps={{
								readOnly: true,
								'aria-labelledby': 'input-slider',
							}}
						/>
						<Slider
							orientation="vertical"
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
					</Stack>
				</CardContent>
			</Card>
		</Grid>
	);
}
