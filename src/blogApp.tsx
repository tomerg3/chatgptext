import { Loader, Box, Card } from "wix-style-react";
import { observeState } from "@wix/dashboard-sdk";
import { useEffect, useState } from "react";
import { Widget } from "./widget";

export interface DashboardWidgetProps {
    onLoaded?: () => void;
    getPostTitle: () => Promise<string>;
    getPostContent: () => Promise<any>;
    setPostContent: (content: any) => void;
    setPostTitle: (title: string) => void;
}

export const BlogAppsExtension = () => {
    const [loaded, setLoaded] = useState(false);
    const [props, setProps] = useState({});
    useEffect(() => {
        observeState<DashboardWidgetProps>((props) => {
            console.log("BlogAppsExtension props = ", props);
            setLoaded(true);
            setProps(props);
        });
    }, []);
    if (!loaded) {
        return <Loader />;
    } else {
        return (
            <Widget
                setPostContent={function (_content: any): void {
                    throw new Error("Function not implemented.");
                }}
                setPostTitle={function (_title: string): void {
                    throw new Error("Function not implemented.");
                }}
                getPostTitle={function (): Promise<string> {
                    throw new Error("Function not implemented.");
                }}
                getPostContent={function (): Promise<any> {
                    throw new Error("Function not implemented.");
                }}
                {...props}
            />
        );
    }
};
