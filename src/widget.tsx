axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded";
import { observeState } from "@wix/dashboard-sdk";
import { showToast } from "@wix/dashboard-sdk";
import axios from "axios";
import { FC, useEffect, useState, useRef } from "react";
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
    FloatingHelper,
    SectionHelper,
    TextButton,
} from "wix-style-react";
import { DismissSmall } from "@wix/wix-ui-icons-common";
import { theme } from "wix-style-react/themes/businessDashboard";
import CONFIG from "../data/app-config";
import { getInstance, getAdminKey } from "../data/utils";
import {
    CrashedApp,
    InstallationError,
    PageLoader,
} from "./WarningScreens/WarningScreens";
import { RichContent, decoration_TypeFromJSON } from "ricos-schema";
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
    const [title, setTitle] = useState<string>("");
    const [helperStep, setHelperStep] = useState<number>(1);
    const [isHelperOpen, setIsHelperOpen] = useState(true);
    const [content, setContent] = useState(false);
    const [warningIsOpen, setWarningIsOpen] = useState(false);
    const [observerLoader, setObserverLoader] = useState(false);

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
                                ? data.plan.charAt(0).toUpperCase() +
                                      data.plan.slice(1).toLowerCase()
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

                        if (data.blogTutorialFinished == 1) {
                            setIsHelperOpen(false);
                        } else {
                            setIsHelperOpen(true);
                        }
                    }
                })
                .catch((error) => {
                    console.log("error from receiveing appData", error);
                });

            getAppDataRequested.current = true;
        }
    }, []);

    useEffect(() => {
        observeState(async (state: any, envData: any) => {
            console.log("observer state is runing");
            try {
                console.log("Getting post title...");
                const postTitle = await state.getPostTitle();
                console.log("Post title obtained.");
                setDraftName(postTitle);
                setTitle(postTitle);
                const postContent = await state.getPostContent();
                if (postContent && postContent.nodes) {
                    (postContent.nodes as any[]).forEach((paragraph) => {
                        if (
                            paragraph.type === "PARAGRAPH" &&
                            paragraph.nodes.length > 0
                        ) {
                            const hasNonEmptyText = paragraph.nodes.some(
                                (node: any) => {
                                    return (
                                        node.type === "TEXT" &&
                                        node.textData.text.trim() !== ""
                                    );
                                }
                            );
                            if (hasNonEmptyText) {
                                setContent(false);
                            } else {
                                setContent(true);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Error checking post:", error);
            }
        });
    }, []);

    const [titleHandlerLoader, setTitleHandlerLoader] = useState(false)

    const generateButton = () => {
        setObserverLoader(true);
        new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log("promise timeout")
                resolve();
            }, 3500);
        })
        .then(() => {
            setTitleHandlerLoader(true);
        })
    };

    const titleHandler = () => {
        console.log("then - ", draftName)
        if (draftName && draftName !== "" && content) {
            setWarningIsOpen(false);
            generateButtonHandler({ preventDefault: () => {} });
            setObserverLoader(false);
            return;
        } else if (!draftName || draftName == "") {
            setWarningIsOpen(false);
            showToast({
                message:
                    "Start by entering a Catchy Title so ChatGPT could write the content",
                type: "error",
            });
            setObserverLoader(false);
            return;
        } else if (draftName && draftName !== "" && !content) {
            setWarningIsOpen(true);
            setObserverLoader(false);
            return;
        } else {
            showToast({
                message: "Start by entering a Catchy Title so ChatGPT could write the content",
                type: "error",
            });
            setObserverLoader(false);
            return;
        }
    }

    useEffect(() => {
        if(titleHandlerLoader){
            titleHandler();
            setTitleHandlerLoader(false);
        }
    }, [titleHandlerLoader])

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

    const generateButtonHandlerWrapper = () => {
        generateButtonHandler({ preventDefault: () => {} });
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
                setWarningIsOpen(false);
            })
            .catch((error) => {
                showToast({
                    message:
                        "Something went wrong, please refresh the page and try again.",
                    type: "error",
                });
                console.log("error genrating button:", error);
                setGenButtonLoading(false);
                setWarningIsOpen(false);
            });
    };

    const handleHelperActionClick = () => {
        if (helperStep <= 7) {
            setHelperStep((step) => step + 1);
        } else {
            setIsHelperOpen(false);
        }
    };
    const handlePreviousActionClick = () => {
        if (helperStep <= 7) {
            setHelperStep((step) => Math.max(1, step - 1));
        } else {
            setIsHelperOpen(false);
        }
    };
    const helperClose = () => {
        setIsHelperOpen(false);
        axios.post(CONFIG.ajaxUrl, {
            action: "tutorialFinished",
            instance: getInstance(),
            k: getAdminKey(),
            blogTutorialFinished: 1,
        });
    };

    useEffect(() => {
        if (isHelperOpen && helperStep === 4) {
            const voiceDropdown = document.querySelector(
                '[data-hook="gpt-voice"] input'
            ) as HTMLInputElement;
            if (voiceDropdown) {
                voiceDropdown.click();
            }
        }

        let targetElement;
        if (helperStep == 1 || helperStep == 2) {
            targetElement = document.querySelector(
                '[data-hook="gpt-additional-details"]'
            );
        } else if (helperStep == 3) {
            targetElement = document.querySelector(
                '[data-hook="gpt-number-words"]'
            );
        } else if (helperStep == 4) {
            targetElement = document.querySelector('[data-hook="gpt-voice"]');
        } else if (helperStep == 5) {
            targetElement = document.querySelector(
                '[data-hook="gpt-target-audience"]'
            );
        } else if (helperStep == 6) {
            targetElement = document.querySelector('[data-hook="gpt-version"]');
        } else if (helperStep >= 7) {
            targetElement = document.querySelector(
                '[dataHook="gpt-product-generate-button"]'
            );
        }

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth" });
        }
    }, [isHelperOpen, helperStep]);

    useEffect(() => {
        const popoverArrow = document.querySelector(
            '[data-hook="popover-arrow"]'
        );
        if (popoverArrow) {
            (popoverArrow as HTMLElement).style.display = "none";
        }
    }, []);

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
                    <Layout alignItems="center">
                        <Cell span={6}>
                            <Box direction="vertical" align="center">
                                <Text weight="bold" size="small">
                                    Plan Type
                                </Text>
                                <Text size="small">{planType}</Text>
                            </Box>

                            <Box align="center" paddingTop={"10px"}>
                                <Button
                                    skin="dark"
                                    priority="primary"
                                    size="medium"
                                    onClick={() => {
                                        setIsHelperOpen(true);
                                        setHelperStep(1);
                                    }}
                                >
                                    Tutorial
                                </Button>
                            </Box>
                        </Cell>
                        <Cell span={6}>
                            <Box direction="vertical" align="center">
                                <Text weight="bold" size="small">
                                    Tokens
                                </Text>
                                <Text size="small">
                                    {remainingTokens
                                        ?.toString()
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    /
                                    {totalTokens
                                        ?.toString()
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </Text>
                            </Box>

                            {planType !== "premium" && (
                                <Box align="center" paddingTop={"10px"}>
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
                            )}
                        </Cell>
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
                            <FormField
                                label={
                                    isHelperOpen &&
                                    helperStep === 1 && (
                                        <Box
                                            padding="20px"
                                            backgroundColor="D10"
                                            borderRadius={"10px"}
                                            position="absolute"
                                            top="-10px"
                                            zIndex={1000}
                                        >
                                            <Box
                                                position="absolute"
                                                top="10px"
                                                right="10px"
                                            >
                                                <TextButton
                                                    onClick={helperClose}
                                                    skin="light"
                                                >
                                                    <DismissSmall />
                                                </TextButton>
                                            </Box>
                                            <FloatingHelper.Content
                                                body={
                                                    <Box
                                                        direction="vertical"
                                                        gap={"20px"}
                                                    >
                                                        <Text light>
                                                            Start by entering a
                                                            catchy title for
                                                            your Blog Post (to
                                                            the right), it will
                                                            help ChatGPT create
                                                            the best content for
                                                            your post.
                                                        </Text>
                                                        <Box
                                                            direction="horizontal"
                                                            gap={"20px"}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                priority="secondary"
                                                            >
                                                                Next
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </Box>
                                    )
                                }
                                statusMessage={
                                    <FloatingHelper
                                        opened={
                                            isHelperOpen && helperStep === 2
                                        }
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Include any information you would like mentioned, or any specific instructions."
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box
                                                        direction="vertical"
                                                        gap="20px"
                                                    >
                                                        <Text light>
                                                            Include any
                                                            information you
                                                            would like
                                                            mentioned, or any
                                                            specific
                                                            instructions.
                                                        </Text>
                                                        <Text light>
                                                            For Example:
                                                            <br />
                                                            <ul>
                                                                <li>
                                                                    {" "}
                                                                    Mention at
                                                                    least 5
                                                                    times each
                                                                    of the
                                                                    following
                                                                    keywords
                                                                    "keyword 1",
                                                                    "keyword 2".
                                                                </li>
                                                                <li>
                                                                    List a few
                                                                    pros and
                                                                    cons
                                                                </li>
                                                                <li>
                                                                    {" "}
                                                                    Expand on
                                                                    the
                                                                    following
                                                                    point: You
                                                                    can only
                                                                    help those
                                                                    who want to
                                                                    help
                                                                    themselves.
                                                                </li>
                                                            </ul>
                                                        </Text>
                                                        <Box
                                                            direction="horizontal"
                                                            gap={"20px"}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Next
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        }
                                        placement="bottom"
                                    />
                                }
                                dataHook="gpt-additional-details"
                            >
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
                                    <FloatingHelper
                                        opened={
                                            isHelperOpen && helperStep === 3
                                        }
                                        width={"280px"}
                                        onClose={helperClose}
                                        target={
                                            selectedVersion === 0
                                                ? "Each word uses approximately 1-2 tokens)."
                                                : "Each word uses approximately 5-10 tokens)."
                                        }
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box
                                                        direction="vertical"
                                                        gap={"20px"}
                                                    >
                                                        <Text light>
                                                            Select the desired
                                                            length of the
                                                            description
                                                        </Text>
                                                        <Box
                                                            direction="horizontal"
                                                            gap={"20px"}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Next
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        }
                                        placement="bottom"
                                    />
                                }
                                data-hook="gpt-number-words"
                            >
                                <NumberInput
                                    value={wordsNum}
                                    onChange={handleWordsNumChange}
                                    min={0}
                                />
                            </FormField>
                        </Cell>
                        <Cell span={12}>
                            <FormField
                                label={
                                    <FloatingHelper
                                        opened={
                                            isHelperOpen && helperStep === 4
                                        }
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Writing Style (Voice)"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box
                                                        direction="vertical"
                                                        gap={"20px"}
                                                    >
                                                        <Text light>
                                                            Select the desired
                                                            writing style
                                                            (voice) from our
                                                            existing list, or
                                                            enter your own
                                                        </Text>
                                                        <Box
                                                            direction="horizontal"
                                                            gap={"20px"}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Next
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        }
                                        placement="top"
                                    />
                                }
                                statusMessage={
                                    selectedWritingStyle !== 10
                                        ? writingStylesOptions[
                                              selectedWritingStyle
                                          ].description
                                        : "20 letters max"
                                }
                            >
                                <Dropdown
                                    selectedId={selectedWritingStyle}
                                    options={writingStylesOptions}
                                    onSelect={handleSelectWritingStyle}
                                    dataHook="gpt-voice"
                                />
                            </FormField>
                        </Cell>
                        {selectedWritingStyle === 10 && (
                            <Cell span={12}>
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
                                label={
                                    <FloatingHelper
                                        opened={
                                            isHelperOpen && helperStep === 5
                                        }
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Target Audience"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box
                                                        direction="vertical"
                                                        gap="20px"
                                                    >
                                                        <Text light>
                                                            You have the option
                                                            to select one or
                                                            more target
                                                            audiences for
                                                            tailored content
                                                            that addresses their
                                                            specific needs,
                                                            preferences, and
                                                            lifestyles
                                                        </Text>
                                                        <Text light>
                                                            * Selection a Target
                                                            Audience is useful
                                                            for longer
                                                            descriptions (100+
                                                            words)
                                                        </Text>
                                                        <Box
                                                            direction="horizontal"
                                                            gap={"20px"}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Next
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        }
                                        placement="top"
                                    />
                                }
                                statusMessage="Select one or more target audience for tailored content that addresses their specific needs, preferences, and lifestyles."
                                data-hook="gpt-target-audience"
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
                                label={
                                    <FloatingHelper
                                        opened={
                                            isHelperOpen && helperStep === 6
                                        }
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="ChatGPT Version"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box
                                                        direction="vertical"
                                                        gap="20px"
                                                    >
                                                        <Text light>
                                                            Select the ChatGPT
                                                            version to use
                                                        </Text>
                                                        <Text light>
                                                            3.5 (Basic version)
                                                            provides proficient
                                                            text generation with
                                                            a solid foundation
                                                            of understanding and
                                                            creativity
                                                        </Text>
                                                        <Text light>
                                                            4 (Advanced version)
                                                            offers enhanced
                                                            understanding, more
                                                            coherent responses,
                                                            and an improved
                                                            ability to provide
                                                            detailed and
                                                            accurate
                                                            information.
                                                        </Text>
                                                        <Box
                                                            direction="horizontal"
                                                            gap={"20px"}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="premium-light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Next
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        }
                                        placement="top"
                                    />
                                }
                                statusMessage={
                                    selectedVersion === 0
                                        ? "GPT-3.5 provides proficient text generation with a solid foundation of understanding and creativity."
                                        : "GPT-4 offers enhanced understanding, more coherent responses, and an improved ability to provide detailed and accurate information."
                                }
                                data-hook="gpt-version"
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
                            <FloatingHelper
                                opened={isHelperOpen && helperStep === 7}
                                width={"280px"}
                                onClose={helperClose}
                                target={
                                    <>
                                        {!warningIsOpen ? (
                                            <Button
                                                size="medium"
                                                dataHook="gpt-product-generate-button"
                                                onClick={generateButton}
                                            >
                                                {genButtonLoading ||
                                                observerLoader ? (
                                                    <Loader size="tiny" />
                                                ) : (
                                                    "Generate Blog Post"
                                                )}
                                            </Button>
                                        ) : (
                                            <SectionHelper appearance="warning">
                                                <Layout>
                                                    <Cell span={12}>
                                                        <Box direction="vertical">
                                                            <Text>
                                                                The content of
                                                                the current blog
                                                                will be
                                                                overwritten
                                                            </Text>
                                                        </Box>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Box
                                                            direction="horizontal"
                                                            width={"100%"}
                                                            gap={"10px"}
                                                        >
                                                            <Button
                                                                onClick={() =>
                                                                    setWarningIsOpen(
                                                                        false
                                                                    )
                                                                }
                                                                priority="secondary"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                onClick={
                                                                    generateButtonHandlerWrapper
                                                                }
                                                            >
                                                                {genButtonLoading ||
                                                                observerLoader ? (
                                                                    <Loader size="tiny" />
                                                                ) : (
                                                                    "Continue"
                                                                )}
                                                            </Button>
                                                        </Box>
                                                    </Cell>
                                                </Layout>
                                            </SectionHelper>
                                        )}
                                    </>
                                }
                                content={
                                    <FloatingHelper.Content
                                        body={
                                            <Box
                                                direction="vertical"
                                                gap={"20px"}
                                            >
                                                <Text light>
                                                    After entering all the
                                                    information and selecting
                                                    the desired settings, click
                                                    on Generate Description
                                                </Text>
                                                <Box
                                                    direction="horizontal"
                                                    gap={"20px"}
                                                >
                                                    <Button
                                                        onClick={() => {
                                                            handlePreviousActionClick();
                                                        }}
                                                        skin="premium-light"
                                                        size="small"
                                                        priority="secondary"
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            handleHelperActionClick();
                                                        }}
                                                        skin="premium-light"
                                                        size="small"
                                                        priority="secondary"
                                                    >
                                                        Got It!
                                                    </Button>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                }
                                placement="bottom"
                            />
                            <Box paddingBottom={"25px"}></Box>
                        </Cell>
                    </Layout>
                </Box>
            </Card>
        </ThemeProvider>
    );
};
