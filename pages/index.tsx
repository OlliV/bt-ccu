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

export default function Home() {
	return (
		<Container maxWidth="md">
			<MyHead />
			<Box position="relative">
				<Title disableBack>CCU</Title>
				<Grid container direction="row" alignItems="center" spacing={2}>
					<Grid item xs={9}>
						<Grid container direction="row" spacing={2}>
							<Gain />
							<ShutterAngle />
							<WB />
						</Grid>
					</Grid>
					<Aperture />
					<CC />
				</Grid>
			</Box>
		</Container>
	);
}
