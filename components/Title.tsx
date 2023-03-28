import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import IconSettings from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Popover from '@mui/material/Popover';
import React, { useState } from 'react';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { AlertColor } from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { GlobalState, useGlobalState } from '../lib/global';

type Notification = {
	severity: AlertColor;
	icon?: React.ReactNode;
	permanent?: boolean; // can't be cleared with X, i.e. action is mandatory
	text: string;
};

const sxArrowEnabled = {
	'&:hover': {
		color: 'grey',
		cursor: 'pointer',
	},
};

const sxArrowDisabled = {
	visibility: 'hidden',
};

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

function BackButton({ disable, onClick }: { disable: boolean; onClick?: (e?: React.MouseEvent<HTMLElement>) => void }) {
	return (
		<Typography sx={disable ? sxArrowDisabled : sxArrowEnabled} onClick={onClick}>
			&larr; &nbsp;
		</Typography>
	);
}

function Setup() {
	const router = useRouter();

	const openSettings = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault();
		router.push('/setup');
	};

	return (
		<Box>
			<IconButton
				onClick={openSettings}
				size="large"
				aria-label="open settings"
				color="inherit"
			>
			<IconSettings />
		</IconButton>
		</Box>
	);
}

function useNotifications(): [Notification[], (notification: Notification) => void] {
	const [clearedNotifications, setClearedNotifications] = useState<string[]>([]);
	const notifications: Notification[] = [
	].filter(({ text }) => !clearedNotifications.includes(text));
	const clearNotification = (notification: Notification) =>
		setClearedNotifications([...clearedNotifications, notification.text]);

	return [notifications, clearNotification];
}

function Notifications({
	notifications,
	clearNotification,
}: {
	notifications: Notification[];
	clearNotification: (notifications: Notification) => void;
}) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;

	return (
		<Box>
			<IconButton
				size="large"
				aria-label={`show ${notifications.length} new notifications`}
				color="inherit"
				onClick={handleClick}
			>
				<Badge badgeContent={notifications.length} color="error">
					<NotificationsIcon />
				</Badge>
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<Stack sx={{ width: '100%' }} spacing={1}>
					{notifications.length ? (
						notifications.map((msg, i) => (
							<Alert
								icon={msg.icon}
								severity={msg.severity}
								onClose={msg.permanent ? undefined : () => clearNotification(msg)}
								key={`notification_${i}`}
							>
								{msg.text}
							</Alert>
						))
					) : (
						<Typography sx={{ p: 2 }}>No notifications</Typography>
					)}
				</Stack>
			</Popover>
		</Box>
	);
}

export default function Title({
	disableBack,
	href,
	className,
	children,
}: {
	disableBack?: boolean;
	href?: string;
	className?: string;
	children: any;
}) {
	const router = useRouter();
	const [notifications, clearNotification] = useNotifications();

	const goBack = (e: React.MouseEvent<HTMLElement>) => {
		if (disableBack) {
			e.preventDefault();
		} else if (href) {
			router.push(href);
		} else {
			router.back();
		}
	};

	return (
		<Box sx={{ flexGrow: 1 }}>
			<AppBar position="fixed" elevation={0} sx={{ left: 0, width: '100vw' }}>
				<Toolbar>
					<BackButton disable={disableBack} onClick={goBack} />
					<Typography variant="h6" noWrap component="div">
						{children}
					</Typography>
					<Box sx={{ flexGrow: 1 }} />
					<Setup />
					<Notifications notifications={notifications} clearNotification={clearNotification} />
				</Toolbar>
			</AppBar>
			<Offset />
		</Box>
	);
}
