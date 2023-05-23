import Box from '@mui/system/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import MyHead from '../components/MyHead';
import Title from '../components/Title';
import Gain from '../components/Gain';
import ShutterAngle from '../components/Shutter';
import CC from '../components/CC';
import WB from '../components/WB';
import Aperture from '../components/Aperture';
import Servo from '../components/Servo';

export default function Home() {
	const spacing = 2;

	return (
		<Container maxWidth="md">
			<MyHead />
			<Box position="relative">
				<Title disableBack>CCU</Title>
				<Grid container direction="row" alignItems="center" spacing={spacing}>
					<Grid item xs={6}>
						<Grid container direction="row" spacing={spacing}>
							<Gain />
							<ShutterAngle />
							<WB />
						</Grid>
					</Grid>
					<Servo />
					<Aperture />
					<CC />
				</Grid>
			</Box>
		</Container>
	);
}
