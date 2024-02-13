axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded";
import { observeState } from "@wix/dashboard-sdk";
import { showToast } from "@wix/dashboard-sdk";
import axios from "axios";
import { FC, useEffect, useState, useRef  } from "react";
import {
    Card,
    FormField,
    ThemeProvider,
    NumberInput,
    Layout,
    Cell,
    Dropdown,
    Input,
    MultiSelectCheckbox,
    Text,
    DropdownLayoutValueOption,
    Button,
    InputArea,
    Box,
    Loader,
    Divider,
} from "wix-style-react";
import { theme } from "wix-style-react/themes/businessDashboard";
import CONFIG from "../data/app-config";
import { getInstance, getAdminKey } from "../data/utils";
import {
    CrashedApp,
    InstallationError,
    PageLoader,
} from "./WarningScreens/WarningScreens";
import { RichContent } from "ricos-schema";
import { Node, Node_Type } from "ricos-schema";
// import { PremiumSmall } from '@wix/wix-ui-icons-common';
import { writingOptions, servicesOptions } from "./dropdowns";

export interface DashboardWidgetProps {
    onLoaded?: () => void;
}

export const Widget: FC = () => {
    const [isAppCrashed, setIsAppCrashed] = useState(false);
    const [appData, setAppData] = useState(false);
    const [planType, setPlanType] = useState<string>("");
    const [remainingTokens, setRemainingTokens] = useState<number>();
    const [totalTokens, setTotalTokens] = useState<number>();
    const [genButtonLoading, setGenButtonLoading] = useState(false);
    const [wordsNum, setWordsNum] = useState<number>(500);
    const [draftName, setDraftName] = useState<string>("");

    const getAppDataRequested = useRef(false);

    useEffect(() => {
        if (!getAppDataRequested.current) {
            const search = window.location.search;
            const params = new URLSearchParams(search);
            const instance = params.get("instance");
    
            axios
                .post(CONFIG.ajaxUrl, {
                    instance: instance,
                    action: "getAppData",
                    k: getAdminKey(),
                })
                .then((response) => {
                    return response.data;
                })
                .then((data) => {
                    if (!data || typeof data.instance_id === "undefined") {
                        setIsAppCrashed(true);
                    } else {
                        setAppData(data);
                        setPlanType(
                            data.plan
                                ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1).toLowerCase()
                                : "Free"
                        );
                        
                        const totalTokens = parseInt(
                            data.totalTokens.replace(/,/g, "")
                        );
                        setTotalTokens(totalTokens);
                        const tokensUsage = parseInt(
                            data.tokensUsage.replace(/,/g, "")
                        );
                        const remaining = totalTokens - tokensUsage;
                        setRemainingTokens(remaining < 0 ? 0 : remaining);
                    }
                })
                .catch((error) => {
                    console.log("error from receiveing appData", error);
                });
    
            getAppDataRequested.current = true;
        }
    }, []);

    const observerCallback = (state: any, envData: any) => {
        const postTitle = state.getPostTitle();
        postTitle.then((postTitle: string) => {
            setDraftName(postTitle);
        });
    };

    useEffect(() => {
        observeState(observerCallback);
    }, []);

    const [additionalInfo, setAdditionalInfo] = useState("");
    const [selectedWritingStyle, setSelectedWritingStyle] = useState<number>(1);
    const [customStyle, setCustomStyle] = useState<string>("");
    const writingStylesOptions = writingOptions;

    const [selectedVersion, setSelectedVersion] = useState<number>(0);
    const versionOptions = [
        { id: 0, value: "3.5: Basic Version" },
        { id: 1, value: "4: Advanced Version" },
    ];

    const [customAudience, setCustomAudience] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState<number[]>([0]);
    const serviceOptions = servicesOptions.map((option) => ({
        ...option,
        disabled: option.id === 0 ? selectedOptions.length > 0 : false,
    }));

    useEffect(() => {
        if (selectedOptions.length > 1 && selectedOptions.includes(0)) {
            setSelectedOptions((prevOptions) =>
                prevOptions.filter((option) => option !== 0)
            );
        } else if (selectedOptions.length === 0) {
            setSelectedOptions([0]);
        }
    }, [selectedOptions]);

    const handleSelectWritingStyle = (option: DropdownLayoutValueOption) => {
        setSelectedWritingStyle(option.id as number);
    };

    const handleSelectVersion = (option: DropdownLayoutValueOption) => {
        setSelectedVersion(option.id as number);
    };

    const handleCustomStyleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setCustomStyle(e.target.value);
    };

    const handleCustomAudienceChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setCustomAudience(e.target.value);
    };

    const handleWordsNumChange = (value: number | null) => {
        setWordsNum(value ?? 0);
    };

    const handleAdditionalInfoChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setAdditionalInfo(e.target.value);
    };

    const generateButtonHandler = (event: { preventDefault: () => void }) => {
        event.preventDefault();

        setGenButtonLoading(true);
        axios
            .post(CONFIG.ajaxUrl, {
                instance: getInstance(),
                action: "generateBlogDescription",
                draftName: draftName,
                additionalInfo: additionalInfo,
                wordsNum: wordsNum,
                style: selectedWritingStyle,
                customStyle: customStyle,
                targetAudience: selectedOptions,
                customAudience: customAudience,
                gptVersion: selectedVersion,
                k: getAdminKey(),
            })
            .then((response) => {
                if (totalTokens && response.data.tokensUsage) {
                    const tokensUsage = parseInt(response.data.tokensUsage);
                    const remaining = totalTokens - tokensUsage;
                    setRemainingTokens(remaining < 0 ? 0 : remaining);
                }
                if (response.data.response) {
                    const responseData = response.data.response;
                    const paragraphs = responseData
                        .split("\n\n")
                        .map((paragraph: string) => ({
                            type: Node_Type.PARAGRAPH,
                            nodes: [
                                {
                                    textData: {
                                        text: paragraph + "\n",
                                        decorations: [],
                                    },
                                },
                            ],
                        }));
                    const newRichContent: RichContent = {
                        nodes: paragraphs,
                    };
                    console.log("newRichContent", newRichContent);
                    observeState((state: any, envData: any) => {
                        const postTitle = state.getPostTitle();
                        postTitle.then((postTitle: string) => {
                            setDraftName(postTitle);
                        });
                        state.setPostContent(newRichContent);
                    });
                }
                return response.data;
            })
            .then((data) => {
                if (!data || data.error) {
                    if (data.error) {
                        showToast({
                            message: data.error,
                            type: "error",
                        });
                    } else {
                        showToast({
                            message:
                                "Something went wrong, please refresh the page and try again.",
                            type: "error",
                        });
                    }
                } else {
                    showToast({
                        message: "Content successfully generated.",
                        type: "success",
                    });
                }
                setGenButtonLoading(false);
            })
            .catch((error) => {
                showToast({
                    message:
                        "Something went wrong, please refresh the page and try again.",
                    type: "error",
                });
                console.log("error genrating button:", error);
                setGenButtonLoading(false);
            });
    };

    if (isAppCrashed) {
        return <CrashedApp />;
    }

    if (!appData) {
        return <PageLoader />;
    }

    if ((appData as any)?.instance_id === false) {
        return <InstallationError />;
    }

    return (
        <ThemeProvider theme={theme({ active: true })}>
            <Card stretchVertically>
                <Box padding="0 !important">
                    <Layout>
                        <Cell span={4}>
                            <Box direction="vertical">
                                <Text weight="bold" size="small">
                                    Plan Type
                                </Text>
                                <Text size="small">{planType}</Text>
                            </Box>
                        </Cell>
                        <Cell span={4}>
                            <Box direction="vertical">
                                <Text weight="bold" size="small">
                                    Tokens
                                </Text>
                                <Text size="small">
                                    {remainingTokens
                                        ?.toString()
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </Text>
                            </Box>
                        </Cell>
                        {planType !== "premium" && (
                            <Cell span={4}>
                                <Box direction="vertical">
                                    <Button
                                        as="a"
                                        skin="premium"
                                        href={CONFIG.upgradeUrl}
                                        target="_blank"
                                        size="medium"
                                    >
                                        Upgrade
                                    </Button>
                                </Box>
                            </Cell>
                        )}
                    </Layout>
                </Box>
            </Card>
            <Box padding={2}>
                <Divider />
            </Box>
            <Card stretchVertically>
                <Box padding="0 !important">
                    <Layout alignItems="center">
                        <Cell span={12}>
                            <FormField label="Additional Information">
                                <InputArea
                                    value={additionalInfo}
                                    onChange={handleAdditionalInfoChange}
                                    rows={6}
                                />
                            </FormField>
                        </Cell>
                        <Cell span={12}>
                            <FormField
                                label="Number of Words"
                                statusMessage={
                                    selectedVersion === 0
                                        ? "Each word uses approximately 1-2 tokens)."
                                        : "Each word uses approximately 5-10 tokens)."
                                }
                            >
                                <NumberInput
                                    value={wordsNum}
                                    onChange={handleWordsNumChange}
                                    min={0}
                                />
                            </FormField>
                        </Cell>
                        <Cell span={selectedWritingStyle !== 10 ? 12 : 6}>
                            <FormField
                                label="Writing Style (Voice)"
                                statusMessage={
                                    writingStylesOptions[selectedWritingStyle]
                                        .description
                                }
                            >
                                <Dropdown
                                    selectedId={selectedWritingStyle}
                                    options={writingStylesOptions}
                                    onSelect={handleSelectWritingStyle}
                                />
                            </FormField>
                        </Cell>
                        {selectedWritingStyle === 10 && (
                            <Cell span={6}>
                                <FormField>
                                    <Input
                                        value={customStyle}
                                        placeholder="Writing Style"
                                        onChange={handleCustomStyleChange}
                                        maxLength={20}
                                    />
                                </FormField>
                            </Cell>
                        )}
                        <Cell span={12}>
                            <FormField
                                label="Target Audience"
                                statusMessage="Select one or more target audience for tailored content that addresses their specific needs, preferences, and lifestyles."
                            >
                                <MultiSelectCheckbox
                                    options={serviceOptions}
                                    selectedOptions={selectedOptions}
                                    onSelect={(option) =>
                                        setSelectedOptions([
                                            ...selectedOptions,
                                            Number(option),
                                        ])
                                    }
                                    onDeselect={(option) =>
                                        setSelectedOptions(
                                            selectedOptions.filter(
                                                (item) =>
                                                    item !== Number(option)
                                            )
                                        )
                                    }
                                />
                            </FormField>
                        </Cell>
                        {selectedOptions.includes(22) && (
                            <Cell span={12}>
                                <FormField label="Custom Audience">
                                    <Input
                                        value={customAudience}
                                        placeholder="Target Audience"
                                        onChange={handleCustomAudienceChange}
                                    />
                                </FormField>
                            </Cell>
                        )}

                        <Cell span={12}>
                            <FormField
                                label="ChatGPT Version"
                                statusMessage={
                                    selectedVersion === 0
                                        ? "GPT-3.5 provides proficient text generation with a solid foundation of understanding and creativity."
                                        : "GPT-4 offers enhanced understanding, more coherent responses, and an improved ability to provide detailed and accurate information."
                                }
                            >
                                <Dropdown
                                    selectedId={selectedVersion}
                                    options={versionOptions}
                                    onSelect={handleSelectVersion}
                                />
                            </FormField>
                            <Text weight="bold">
                                {selectedVersion === 0
                                    ? "1-2 tokens per word"
                                    : "5-10 tokens per word"}
                            </Text>
                        </Cell>
                        <Cell span={12}>
                            <Button
                                size="medium"
                                dataHook="gpt-product-generate-button"
                                onClick={generateButtonHandler}
                            >
                                {genButtonLoading ? (
                                    <Loader size="tiny" />
                                ) : (
                                    "Generate Blog Post"
                                )}
                            </Button>
                        </Cell>
                    </Layout>
                </Box>
            </Card>
        </ThemeProvider>
    );
};
