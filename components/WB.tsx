import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconAutoWb from '@mui/icons-material/WbAuto';
import IconBulb from '@mui/icons-material/Lightbulb';
import IconButton from '@mui/material/IconButton';
import IconRestart from '@mui/icons-material/RestartAlt';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { Tooltip } from '@mui/material';
import { getGlobalState, useGlobalState } from '../lib/global';
import { Fragment, useEffect, useState } from 'react';

function valueText(value: number) {
	return `${value} K`;
}

export default function WB() {
	const [cameraControl] = useGlobalState('camera_control');
	const [wb, setWB] = useGlobalState('manual_wb');
	const disableSliders = useState(false);
	const tempMarks = [
		{
			value: 2500,
			label: '2500 K',
		},
		{
			value: 5600,
			label: '5600 K',
		},
		{
			value: 10000,
			label: '10000 K',
		},
	];
	const tintMarks = [
		{
			value: -50,
			label: '-50',
		},
		{
			value: 10,
			label: '10',
		},
		{
			value: 50,
			label: '50',
		},
	];

	useEffect(() => {
		if (cameraControl) {
			cameraControl.setWB(wb);
		}
	}, [cameraControl, wb]);

	const autoWB = () => {
		if (cameraControl) {
			cameraControl.setAutoWB();
			const tid = setTimeout(() => {
				setWB(() => getGlobalState('res_wb'));
			}, 15);
			return () => clearTimeout(tid);
		}
	};
	const resetWB = () => setWB([5600, 10]);
	const newTemp = (oldWb, temp) => [temp, oldWb[1]];
	const newTint = (oldWb, tint) => [oldWb[0], tint];

	return (
		<Grid item xs={12}>
			<Card variant="outlined">
				<CardHeader
					avatar={
						<Avatar>
							<IconBulb />
						</Avatar>
					}
					title="White Balance"
					action={
						<Fragment>
							<Tooltip title="Auto WB">
								<span>
									<IconButton
										disabled={!cameraControl}
										onClick={autoWB}
										size="large"
										aria-label="Auto WB"
										color="inherit"
									>
										<IconAutoWb />
									</IconButton>
								</span>
							</Tooltip>
							<Tooltip title="Reset">
								<span>
									<IconButton
										disabled={!cameraControl}
										onClick={resetWB}
										size="large"
										aria-label="reset CC"
										color="inherit"
									>
										<IconRestart />
									</IconButton>
								</span>
							</Tooltip>
						</Fragment>
					}
				/>
				<CardContent>
					<Grid container spacing={6}>
						<Grid item xs={7}>
							<Typography gutterBottom>Color Temp</Typography>
							<Slider
								value={wb[0]}
								disabled={!cameraControl}
								getAriaValueText={valueText}
								valueLabelDisplay="auto"
								marks={tempMarks}
								step={50}
								min={tempMarks[0].value}
								max={tempMarks[tempMarks.length - 1].value}
								onChange={(_ev: Event, value: number) => setWB(newTemp(wb, value))}
							/>
						</Grid>
						<Grid item xs={5}>
							<Typography gutterBottom>Tint</Typography>
							<Slider
								value={wb[1]}
								disabled={!cameraControl}
								getAriaValueText={valueText}
								valueLabelDisplay="auto"
								marks={tintMarks}
								step={1}
								min={tintMarks[0].value}
								max={tintMarks[tintMarks.length - 1].value}
								onChange={(_ev: Event, value: number) => setWB(newTint(wb, value))}
							/>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		</Grid>
	);
}
