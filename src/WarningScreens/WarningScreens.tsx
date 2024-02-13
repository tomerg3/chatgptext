import React from 'react';
import {
    EmptyState,
    Image,
    Page,
    TextButton,
    WixDesignSystemProvider,
    Text,
    Card,
    Loader,
    Box,
} from 'wix-style-react';
import CONFIG from '../../data/app-config';
import * as Icons from '@wix/wix-ui-icons-common';
import serverError from '../../assets/img/EmptyState_ServerError.svg';

export function CrashedApp() {
    return (
        <WixDesignSystemProvider>
            <Card>
                <Card.Content>
                    <EmptyState
                        theme="page-no-border"
                        image={<Image width="120px" src={serverError} transparent />}
                        title="We couldn't load this page"
                        subtitle="Looks like there was a technical issue on our end. Wait a few minutes and try again."
                    >
                        <TextButton
                            prefixIcon={<Icons.Refresh />}
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </TextButton>
                    </EmptyState>
                </Card.Content>
            </Card>
        </WixDesignSystemProvider>
    );
}

export function InstallationError() {
    return (
        <WixDesignSystemProvider>
            <Card>
                <Card.Content>
                    <Box>
                        <Text weight="bold">
                            Oops, we have detected an issue with the installation of the app, please
                            try to
                        </Text>
                    </Box>
                    <Text align="left">
                        <ol type="1">
                            <li>
                                Go to{' '}
                                <TextButton as="a" href={CONFIG.wixMarketUrl} target="_blank">
                                    {CONFIG.wixMarketUrl}
                                </TextButton>
                            </li>
                            <li>Click Add to Site</li>
                            <li>Approve permissions</li>
                        </ol>
                        <br />
                        If you still see this message, please contact us at{' '}
                        <TextButton as="a" href="mailto:wix@presto-changeo.com">
                            wix@presto-changeo.com
                        </TextButton>{' '}
                        and we will be glad to help.
                    </Text>
                </Card.Content>
            </Card>
        </WixDesignSystemProvider>
    );
}

export function PageLoader() {
    return (
        <WixDesignSystemProvider>
            <Box>
                <Card>
                    <Card.Content>
                        <Box>&nbsp;</Box>
                        <Loader size="medium" />
                    </Card.Content>
                </Card>
            </Box>
        </WixDesignSystemProvider>
    );
}
