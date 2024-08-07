axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
import axios from "axios";
import { showToast } from "@wix/dashboard-sdk";
import { FC, useEffect, useState } from "react";
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
    TagList,
    LinearProgressBar,
    AutoComplete,
} from "wix-style-react";
import { theme } from "wix-style-react/themes/businessDashboard";
import CONFIG from "../data/app-config";
import { getInstance, getAdminKey } from "../data/utils";
import { CrashedApp, InstallationError, PageLoader } from "./WarningScreens/WarningScreens";
import { Node_Type } from "ricos-schema";
import { writingOptions, servicesOptions, generateType } from "./dropdowns";
import { DashboardWidgetProps } from "./blogApp";
import { getLangNameFromCode, getLangCodeList } from "language-name-map";

interface scrollIntoViewOptions {
    behavior: "auto" | "smooth" | "instant";
    block?: "start" | "center" | "end" | "nearest";
    inline?: "start" | "center" | "end" | "nearest";
}

interface AppData {
    wixLanguages: any;
    locale: any;
    plan?: any;
    totalTokens?: any;
    tokensUsage?: any;
    blogTutorialFinished?: any;
}

export const Widget: FC<DashboardWidgetProps> = (props) => {
    const [isAppCrashed, setIsAppCrashed] = useState(false);
    const [appData, setAppData] = useState<AppData | null>(null);
    const [planType, setPlanType] = useState<string>("");
    const [remainingTokens, setRemainingTokens] = useState<number>();
    const [totalTokens, setTotalTokens] = useState<number>();
    const [wordsNum, setWordsNum] = useState<number>(500);
    const [draftName, setDraftName] = useState("");
    const [draftNameError, setDraftNameError] = useState("");
    const [helperStep, setHelperStep] = useState<number>(1);
    const [isHelperOpen, setIsHelperOpen] = useState(true);
    const [content, setContent] = useState(true);
    const [warningIsOpen, setWarningIsOpen] = useState(false);
    const [observerLoader, setObserverLoader] = useState(false);

    const [languageOptions, setLanguageOptions] = useState<any>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<any>("en");
    const [fullLanguageName, setFullLanguageName] = useState<any>("");
    const [searchValue, setSearchValue] = useState<any>("");

    const [defaultContent, setDefaulContent] = useState<any>();
    // const [images, setImages] = useState<any>();
    const [allDefContent, setAllDefContent] = useState<any>();

    const [additionalInfo, setAdditionalInfo] = useState("");
    const [additionalInfoError, setAdditionalInfoError] = useState("");
    const [selectedWritingStyle, setSelectedWritingStyle] = useState<string>("Conversational");
    const [selectedGenerateType, setSelectedGenerateType] = useState<string>("generate");
    const [customStyle, setCustomStyle] = useState<string>("");
    const writingStylesOptions = writingOptions;

    const [selectedVersion, setSelectedVersion] = useState<string>("4-mini");
    const versionOptions = [
        {
            id: "4-mini", 
            value: "4-mini: Efficient Version",
            help: "Faster, versatile model for quick and reliable content generation.",
        },
        {
            id: "4o",
            value: "4o: Advanced Version",
            help: "Latest model with high-quality translation and the most up-to-date features.",
        },
    ];

    const [customAudience, setCustomAudience] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>(["general"]);
    const serviceOptions = servicesOptions.map((option) => ({
        ...option,
        disabled: option.id == "general" ? selectedOptions.length > 0 : false,
    }));

    useEffect(() => {
        const fetchLanguages = async () => {
            const langCodes = getLangCodeList();
            const langOptions = langCodes
                .map((code) => {
                    const lang = getLangNameFromCode(code);
                    return lang ? { id: code, value: lang.name } : null;
                })
                .filter((option) => option !== null);
            setLanguageOptions(langOptions);
        };

        fetchLanguages();
    }, []);

    const customAudienceHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        if (event.key === "Enter") {
            event.persist();
            event.preventDefault();
            const newAudience = target.value.trim();
            if (newAudience !== "") {
                if (customAudience.includes(newAudience)) {
                    showToast({ message: "Audience already exists", type: "error" });
                } else {
                    let customAudiences = [...customAudience, newAudience];
                    setCustomAudience(customAudiences);
                }
                target.value = "";
            }
        }
    };

    const handleDraftNameChange = (e: { target: { value: any } }) => {
        const inputValue = e.target.value;
        if (inputValue.length <= 200) {
            setDraftName(inputValue);
            setDraftNameError("");
        } else {
            setDraftNameError("Blog title cannot exceed 100 characters.");
        }
    };

    const handleAdditionalInfoChange = (e: { target: { value: any } }) => {
        const inputValue = e.target.value;
        if (inputValue.length <= 3000) {
            setAdditionalInfo(inputValue);
            setAdditionalInfoError("");
        } else {
            setAdditionalInfoError("Additional information cannot exceed 3000 characters.");
        }
    };

    useEffect(() => {
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
                    setPlanType(data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1).toLowerCase() : "Free");

                    if (data.totalTokens == "Unlimited" && data.plan == "premium") {
                        const totalTokens = data.totalTokens;
                        setTotalTokens(totalTokens);
                    } else {
                        const totalTokens = parseInt(data.totalTokens.replace(/,/g, ""));
                        setTotalTokens(totalTokens);
                    }
                    const tokensUsage = parseInt(data.tokensUsage.replace(/,/g, ""));
                    setRemainingTokens(tokensUsage);

                    // const remaining = totalTokens - tokensUsage;

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
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const postTitle = await props.getPostTitle();
                setDraftName(postTitle);

                const postContent = await props.getPostContent();

                setAllDefContent(postContent);

                console.log("postContent", postContent);

                if (postContent && postContent.nodes) {
                    //extracting text
                    const extractTexts = (nodes: any[]) => {
                        let texts: any[] = [];
                        nodes.forEach((node) => {
                            if (node.type === "TEXT" && node.textData) {
                                texts.push(node.textData.text);
                            } else if (node.nodes && node.nodes.length > 0) {
                                texts = texts.concat(extractTexts(node.nodes));
                            }
                        });

                        return texts;
                    };
                    const allTexts = extractTexts(postContent.nodes);
                    const combinedText = allTexts.join(" ");

                    // const extractImages = (nodes: any[]) => {
                    //     let images: any[] = [];
                    //     nodes.forEach((node) => {
                    //         if (node.type === "IMAGE") {
                    //             images.push({ id: node.id, data: node.imageData.image });
                    //         }
                    //     });
                    //     return images;
                    // };

                    // const allImages = extractImages(postContent.nodes);
                    // console.log(allImages);
                    // setImages(allImages);

                    setDefaulContent(combinedText);

                    (postContent.nodes as any[]).forEach((paragraph) => {
                        if (paragraph.type === "PARAGRAPH" && paragraph.nodes.length > 0) {
                            const hasNonEmptyText = paragraph.nodes.some((node: any) => {
                                return node.type === "TEXT" && node.textData.text.trim() !== "";
                            });
                            if (hasNonEmptyText) {
                                setContent(false);
                            } else {
                                setContent(true);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to load content:", error);
            }
        })();
    }, []);

    const generateButton = () => {
        if (draftName && content) {
            setWarningIsOpen(false);
            generateButtonHandler({ preventDefault: () => {} });
            return;
        } else if (!draftName) {
            setWarningIsOpen(false);
            showToast({
                message: "Start by entering a Catchy Title so ChatGPT could write the content",
                type: "error",
            });
            setObserverLoader(false);
            return;
        } else if (draftName && !content) {
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
    };

    useEffect(() => {
        if (selectedOptions.length > 1 && selectedOptions.includes("general")) {
            setSelectedOptions((prevOptions) => prevOptions.filter((option) => option !== "general"));
        } else if (selectedOptions.length === 0) {
            setSelectedOptions(["general"]);
        }
    }, [selectedOptions]);

    const handleSelectWritingStyle = (option: DropdownLayoutValueOption) => {
        setSelectedWritingStyle(option.id as string);
    };

    const handleSelectGenerateType = (option: DropdownLayoutValueOption) => {
        setSelectedGenerateType(option.id as string);
    };

    const handleSelectVersion = (option: DropdownLayoutValueOption) => {
        setSelectedVersion(option.id as string);
    };

    useEffect(() => {
        if(selectedLanguage != 'en'){
            setSelectedVersion('4');
        }
    }, [selectedLanguage])

    const handleCustomStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomStyle(e.target.value);
    };

    // const handleCustomAudienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setCustomAudience(e.target.value);
    // };

    const handleWordsNumChange = (value: number | null) => {
        setWordsNum(value ?? 0);
    };

    function getHelpMessageByStyle(selectedStyle: string) {
        const option = writingOptions.find((o) => o.id === selectedStyle);
        return option ? option.help : "Default help message";
    }

    useEffect(() => {
        if (appData?.locale) {
            const lang = getLangNameFromCode(appData.locale);
            if (lang) {
                setSelectedLanguage(appData.locale);
                setSearchValue(lang.name);
                setFullLanguageName(lang.name);
            }
        }
    }, [appData?.locale]);

    function includesCaseInsensitive(a: any = "", b: any = ""): boolean {
        return !b || a.toLowerCase().indexOf(b.toLowerCase()) !== -1;
    }

    const generateButtonHandlerWrapper = () => {
        generateButtonHandler({ preventDefault: () => {} });
    };

    const generateButtonHandler = (event: { preventDefault: () => void }) => {
        event.preventDefault();
        setObserverLoader(true);

        axios
            .post(CONFIG.ajaxUrl, {
                instance: getInstance(),
                k: getAdminKey(),
                action: "generateBlogDescription",
                draftName: draftName,
                additionalInfo: additionalInfo,
                wordsNum: wordsNum,
                style: selectedWritingStyle,
                customStyle: customStyle,
                targetAuidience: selectedOptions,
                customAudience: customAudience,
                gptVersion: selectedVersion,
                ...(!content && { generateType: selectedGenerateType, postContent: defaultContent }),
                blogExtension: 1,
                selectedLanguage: selectedLanguage,
                fullLanguageName: fullLanguageName,
            })
            .then(async (response) => {
                if (totalTokens && response.data.tokensUsage) {
                    const tokensUsage = parseInt(response.data.tokensUsage);
                    setRemainingTokens(tokensUsage);
                }
                if (response.data.response) {
                    const responseData = response.data.response;
                    console.log("responseData", responseData);
                    let newRichContent;

                    const generateId = () => Math.random().toString(36).substr(2, 9);

                    const extractImageAndPosition = (nodes: any[]) => {
                        let imageNode = null;
                        let imagePosition = null;
                        nodes.forEach((node, index) => {
                            if (node.type === "IMAGE" && node.imageData?.image?.src) {
                                imageNode = node;
                                imagePosition = index;
                            }
                        });
                        return { imageNode, imagePosition };
                    };

                    if (!content && selectedGenerateType === "rewrite") {
                        const newParagraphTexts = responseData.split("\n\n");

                        console.log("newParagraphTexts", newParagraphTexts);

                        const { imageNode, imagePosition } = extractImageAndPosition(allDefContent.nodes);
                        const nodesWithoutImage = allDefContent.nodes.filter((node: { type: string }) => node.type !== "IMAGE");

                        let updatedNodes: any[] = [];
                        let textIndex = 0;

                        nodesWithoutImage.forEach((node: any) => {
                            if (node.type === "PARAGRAPH" && textIndex < newParagraphTexts.length) {
                                const updatedParagraph = { ...node, id: generateId(), paragraphData: { textStyle: { textAlignment: "AUTO" } } };
                                if (updatedParagraph.nodes && updatedParagraph.nodes.length > 0 && updatedParagraph.nodes[0].type === "TEXT") {
                                    updatedParagraph.nodes[0].textData.text = newParagraphTexts[textIndex] + "\n";
                                    updatedParagraph.nodes[0].type = "TEXT";
                                    updatedParagraph.nodes[0].id = "";
                                    updatedParagraph.nodes[0].nodes = [];
                                    textIndex++;
                                }
                                updatedNodes.push(updatedParagraph);
                            } else if (node.type !== "PARAGRAPH") {
                                updatedNodes.push(node);
                            }
                        });

                        for (; textIndex < newParagraphTexts.length; textIndex++) {
                            updatedNodes.push({
                                type: "PARAGRAPH",
                                id: generateId(),
                                nodes: [
                                    {
                                        type: "TEXT",
                                        id: "",
                                        nodes: [],
                                        textData: {
                                            text: newParagraphTexts[textIndex],
                                            decorations: [],
                                        },
                                    },
                                ],
                                paragraphData: {
                                    textStyle: {
                                        textAlignment: "AUTO",
                                    },
                                },
                            });
                        }

                        if (imageNode && imagePosition !== null) {
                            updatedNodes.splice(imagePosition, 0, imageNode);
                        }

                        newRichContent = {
                            nodes: updatedNodes,
                            metadata: { version: 1, createdTimestamp: new Date().toISOString(), updatedTimestamp: new Date().toISOString(), id: generateId() },
                        };

                        console.log("newRichContent rewrite", newRichContent);
                    } else {
                        const paragraphs = responseData.split("\n\n").map((paragraph: string) => ({
                            type: "PARAGRAPH",
                            id: generateId(),
                            nodes: [
                                {
                                    type: "TEXT",
                                    id: "",
                                    nodes: [],
                                    textData: {
                                        text: paragraph + "\n",
                                        decorations: [],
                                    },
                                },
                            ],
                            paragraphData: {
                                textStyle: {
                                    textAlignment: "AUTO",
                                },
                            },
                        }));

                        newRichContent = {
                            nodes: paragraphs,
                            metadata: { version: 1, createdTimestamp: new Date().toISOString(), updatedTimestamp: new Date().toISOString(), id: generateId() },
                        };

                        console.log("newRichContent", newRichContent);
                    }

                    props.setPostContent(newRichContent);
                    props.setPostTitle(draftName);
                    setAllDefContent(newRichContent);

                    //extracting text
                    const extractTexts = (nodes: any[]) => {
                        let texts: any[] = [];
                        nodes.forEach((node) => {
                            if (node.type === "TEXT" && node.textData) {
                                texts.push(node.textData.text);
                            } else if (node.nodes && node.nodes.length > 0) {
                                texts = texts.concat(extractTexts(node.nodes));
                            }
                        });

                        return texts;
                    };

                    const allTexts = extractTexts(newRichContent.nodes);
                    const combinedText = allTexts.join(" ");
                    setDefaulContent(combinedText);

                    setObserverLoader(false);
                }
                return response.data;
            })
            .then((data) => {
                if (!data || data.error) {
                    if (data.error) {
                        if (typeof data.planWarning !== "undefined" && data.planWarning) {
                            showToast({
                                message: data.error,
                                type: "error",
                                action: {
                                    uiType: "link",
                                    text: "Upgrade",
                                    removeToastOnClick: true,
                                    onClick: () => {
                                        window.open(CONFIG.upgradeUrl, "_blank");
                                    },
                                },
                            });
                        } else {
                            showToast({
                                message: data.error,
                                type: "error",
                            });
                        }
                    } else {
                        showToast({
                            message: "Something went wrong, please refresh the page and try again.",
                            type: "error",
                        });
                    }
                } else {
                    showToast({
                        message: "Content successfully generated.",
                        type: "success",
                    });
                }
                setWarningIsOpen(false);
                setObserverLoader(false);
            })
            .catch((error) => {
                showToast({
                    message: "Something went wrong, please refresh the page and try again.",
                    type: "error",
                });
                console.log("error generating button:", error);
                setObserverLoader(false);
                setWarningIsOpen(false);
            });
    };

    const handleHelperActionClick = () => {
        if (!content ? helperStep <= 9 : helperStep <= 8) {
            setHelperStep((step) => step + 1);
        } else {
            setIsHelperOpen(false);
        }
    };
    const handlePreviousActionClick = () => {
        if (!content ? helperStep <= 9 : helperStep <= 8) {
            setHelperStep((step) => Math.max(1, step - 1));
        } else {
            setIsHelperOpen(false);
        }
    };
    const helperClose = () => {
        setIsHelperOpen(false);
        axios.post(CONFIG.ajaxUrl, {
            action: "blogTutorialFinished",
            instance: getInstance(),
            k: getAdminKey(),
        });
    };

    useEffect(() => {
        if (content) {
            if (isHelperOpen && helperStep === 4) {
                const voiceDropdown = document.querySelector('[data-hook="gpt-voice"] input') as HTMLInputElement;
                if (voiceDropdown) {
                    voiceDropdown.click();
                }
            }
        } else {
            if (isHelperOpen && helperStep === 5) {
                const voiceDropdown = document.querySelector('[data-hook="gpt-voice"] input') as HTMLInputElement;
                if (voiceDropdown) {
                    voiceDropdown.click();
                }
            }
        }

        let scrollIntoViewOptions: scrollIntoViewOptions = { behavior: "smooth", block: "start" };
        let targetElement;
        if (helperStep == 2) {
            targetElement = content ? document.querySelector('[data-hook="gpt-additional-details"]') : document.querySelector('[data-hook="gpt-generate-type"]');
        } else if (helperStep == 3 || helperStep == 4 || helperStep == 5 || helperStep == 6) {
            if (helperStep == 3 && !content) {
                targetElement = document.querySelector('[data-hook="gpt-additional-details"]');
            } else {
                targetElement = document.querySelector('[data-hook="gpt-number-words"]');
            }
        } else if (helperStep >= 7) {
            targetElement = document.querySelector('[data-hook="gpt-product-generate-button"]');
        }

        if (content) {
            if (helperStep == 4) {
                scrollIntoViewOptions.block = "center";
            }
        } else {
            if (helperStep == 5) {
                scrollIntoViewOptions.block = "center";
            }
        }

        if (targetElement) {
            targetElement.scrollIntoView(scrollIntoViewOptions);
        }
    }, [isHelperOpen, helperStep]);

    useEffect(() => {
        let scrollIntoViewOptions: scrollIntoViewOptions = { behavior: "smooth", block: "center" };
        let targetElement = document.querySelector('[data-hook="gpt-warning"]');
        if (warningIsOpen && targetElement) {
            targetElement.scrollIntoView(scrollIntoViewOptions);
        }
    }, [warningIsOpen]);

    if (isAppCrashed) {
        return <CrashedApp />;
    }

    if (!appData) {
        return (
            <Box align="center">
                <PageLoader />
            </Box>
        );
    }

    if ((appData as any)?.instance_id === false) {
        return <InstallationError />;
    }

    return (
        <ThemeProvider theme={theme({ active: true })}>
            <Card stretchVertically>
                <Box padding="0 !important">
                    <Box border={"1px solid #CFD1DC"} borderRadius={"10px"} width={"100%"} padding={"15px 20px"}>
                        <Card stretchVertically>
                            <Layout gap={"10px"}>
                                <Cell span={12}>
                                    <Text size="small">Your plan: </Text>
                                    <Text size="small" weight="bold">
                                        {planType}
                                    </Text>
                                </Cell>
                                <Cell></Cell>
                            </Layout>
                            <Card.Divider />
                            <Layout gap={"10px"}>
                                <Cell></Cell>
                                <Cell span={12}>
                                    <FormField>
                                        <Box align="space-between" width={"100%"} padding={"0 6px"}>
                                            <Text size="small" skin="standard">
                                                Tokens
                                            </Text>
                                            <Text size="small" skin="standard">
                                                {remainingTokens?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} of {totalTokens?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </Text>
                                        </Box>
                                        {planType.toLocaleLowerCase() !== "premium" && (
                                            <LinearProgressBar skin="premium" value={totalTokens && remainingTokens !== undefined ? 100 - ((totalTokens - remainingTokens) / totalTokens) * 100 : 0} />
                                        )}
                                    </FormField>
                                </Cell>
                                <Cell span={12}>
                                    <Box align="center" paddingTop={"10px"} gap={"20px"}>
                                        {planType.toLocaleLowerCase() !== "premium" && (
                                            <Button as="a" skin="premium" href={CONFIG.upgradeUrl} target="_blank" size="medium">
                                                Upgrade
                                            </Button>
                                        )}
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
                            </Layout>
                        </Card>
                    </Box>
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
                                label="Blog Post Title"
                                charCount={200 - draftName.length}
                                statusMessage={
                                    <FloatingHelper
                                        opened={isHelperOpen && helperStep === 1}
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Start by entering a Blog post title."
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box direction="vertical" gap="20px">
                                                        <Text size="small" light>
                                                            Enter a concise and catchy name for your blog post in the field above.
                                                        </Text>
                                                        <Text size="small" light>
                                                            This name will guide the content generation process, helping ChatGPT understand the theme and direction of your desired blog entry.
                                                        </Text>
                                                        <Box direction="horizontal" gap={"20px"}>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="light"
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
                            >
                                <Input value={draftName} onChange={handleDraftNameChange} placeholder="Enter Blog Title" />
                            </FormField>
                        </Cell>

                        {!content && (
                            <Cell span={12}>
                                <FormField
                                    label="Content Creation Type"
                                    statusMessage={
                                        <FloatingHelper
                                            opened={isHelperOpen && helperStep === 2}
                                            width={"280px"}
                                            onClose={helperClose}
                                            target="You can have ChatGPT write a new post for you, or rewrite your existing post."
                                            content={
                                                <FloatingHelper.Content
                                                    body={
                                                        <Box direction="vertical" gap={"20px"}>
                                                            <Text size="small" light>
                                                                Now that you've set a direction with your blog post title, let's decide on the approach to creating your content. You have two powerful
                                                                options based on your needs:
                                                            </Text>
                                                            <Text size="small" light>
                                                                Create a New Post: Choose this option if you're looking to bring a fresh idea to life. Ideal for when you're exploring new topics,
                                                                trends, or want to add more original content to your site. (* Will replace your existing content)
                                                            </Text>
                                                            <Text size="small" light>
                                                                Rewrite an Existing Post: Opt for this if you have existing content that needs a new spin. Perfect for updating facts, improving
                                                                readability, or adjusting the tone to better match your current audience's expectations.
                                                            </Text>
                                                            <Box direction="horizontal" gap={"20px"}>
                                                                <Button
                                                                    onClick={() => {
                                                                        handlePreviousActionClick();
                                                                    }}
                                                                    skin="light"
                                                                    size="small"
                                                                    priority="secondary"
                                                                >
                                                                    Previous
                                                                </Button>
                                                                <Button
                                                                    onClick={() => {
                                                                        handleHelperActionClick();
                                                                    }}
                                                                    skin="light"
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
                                    dataHook="gpt-generate-type"
                                >
                                    <Dropdown selectedId={selectedGenerateType} options={generateType} onSelect={handleSelectGenerateType} />
                                </FormField>
                            </Cell>
                        )}

                        <Cell span={12}>
                            <FloatingHelper
                                opened={isHelperOpen && helperStep === (!content ? 3 : 2)}
                                width={"280px"}
                                onClose={helperClose}
                                target={
                                    <FormField label="Additional Information" charCount={3000 - additionalInfo.length} dataHook="gpt-additional-details">
                                        <InputArea
                                            value={additionalInfo}
                                            onChange={handleAdditionalInfoChange}
                                            rows={6}
                                            placeholder="Include any information you would like mentioned, or any specific instructions.
* Counted as tokens"
                                        />
                                    </FormField>
                                }
                                content={
                                    <FloatingHelper.Content
                                        body={
                                            <Box direction="vertical" gap="20px">
                                                <Text size="small" light>
                                                    Include any information you would like mentioned, or any specific instructions.
                                                    <br />* Counted as tokens.
                                                </Text>
                                                <Text size="small" light>
                                                    For Example:
                                                    <br />
                                                    <ul>
                                                        <li>Mention at least 5 times each of the following keywords "keyword 1", "keyword 2".</li>
                                                        <li>List a few pros and cons</li>
                                                        <li>Expand on the following point: You can only help those who want to help themselves.</li>
                                                    </ul>
                                                </Text>
                                                <Box direction="horizontal" gap={"20px"}>
                                                    <Button
                                                        onClick={() => {
                                                            handlePreviousActionClick();
                                                        }}
                                                        skin="light"
                                                        size="small"
                                                        priority="secondary"
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            handleHelperActionClick();
                                                        }}
                                                        skin="light"
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
                        </Cell>
                        <Cell span={12}>
                            <FormField
                                label="Number of Words"
                                statusMessage={
                                    <FloatingHelper
                                        opened={isHelperOpen && helperStep === (!content ? 4 : 3)}
                                        width={"280px"}
                                        onClose={helperClose}
                                        target={selectedVersion == "4-mini" ? "Each word uses approximately 1-2 tokens." : "Each word uses approximately 2-3 tokens."}
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box direction="vertical" gap={"20px"}>
                                                        <Text size="small" light>
                                                            Select the desired length of the blog post
                                                        </Text>
                                                        <Box direction="horizontal" gap={"20px"}>
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="light"
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
                                dataHook="gpt-number-words"
                            >
                                <NumberInput value={wordsNum} onChange={handleWordsNumChange} min={0} />
                            </FormField>
                        </Cell>
                        <Cell span={12}>
                            <FormField
                                label={
                                    <FloatingHelper
                                        opened={isHelperOpen && helperStep === (!content ? 5 : 4)}
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Writing Style (Voice)"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box direction="vertical" gap={"20px"}>
                                                        <Text size="small" light>
                                                            Select the desired writing style (voice) from our existing list, or enter your own (By selecting the "custom" option from the list).
                                                        </Text>
                                                        <Box direction="horizontal" gap={"20px"}>
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="light"
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
                                statusMessage={getHelpMessageByStyle(selectedWritingStyle)}
                            >
                                <Dropdown selectedId={selectedWritingStyle} options={writingStylesOptions} onSelect={handleSelectWritingStyle} dataHook="gpt-voice" />
                            </FormField>
                        </Cell>
                        {selectedWritingStyle === "custom" && (
                            <Cell span={12}>
                                <FormField>
                                    <Input value={customStyle} placeholder="Writing Style" onChange={handleCustomStyleChange} maxLength={20} />
                                </FormField>
                            </Cell>
                        )}
                        <Cell span={12}>
                            <FormField
                                label={
                                    <FloatingHelper
                                        opened={isHelperOpen && helperStep === (!content ? 6 : 5)}
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Target Audience"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box direction="vertical" gap="20px">
                                                        <Text size="small" light>
                                                            You have the option to select one or more target audiences for tailored content that addresses their specific needs, preferences, and
                                                            lifestyles
                                                        </Text>
                                                        <Text size="small" light>
                                                            * Selecting a Target Audience is useful for longer descriptions (100+ words)
                                                        </Text>
                                                        <Box direction="horizontal" gap={"20px"}>
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="light"
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
                                dataHook="gpt-target-audience"
                            >
                                <MultiSelectCheckbox
                                    options={serviceOptions}
                                    selectedOptions={selectedOptions}
                                    onSelect={(option) => setSelectedOptions([...selectedOptions, String(option)])}
                                    onDeselect={(option) => setSelectedOptions(selectedOptions.filter((item) => item !== String(option)))}
                                />
                            </FormField>
                        </Cell>
                        {/* {selectedOptions.includes("custom") && (
                            <Cell span={12}>
                                <FormField label="Custom Audience">
                                    <Input value={customAudience} placeholder="Target Audience" onChange={handleCustomAudienceChange} />
                                </FormField>
                            </Cell>
                        )} */}

                        {selectedOptions.includes("custom") && (
                            <Cell>
                                <FormField
                                    label="Custom Audience"
                                    labelPlacement="top"
                                    statusMessage="Enter values in the field above and press 'Enter' to add them to the list. You can add multiple custom audiences."
                                >
                                    <TagList
                                        tags={customAudience.map((tag, index) => ({ id: tag, children: tag, key: index.toString() }))}
                                        toggleMoreButton={(amountOfHiddenTags, isExpanded) => ({
                                            label: isExpanded ? "Show Less" : `+${amountOfHiddenTags} More`,
                                            tooltipContent: !isExpanded && "Show More",
                                        })}
                                        onTagRemove={(tagToRemove) => {
                                            const updatedTags = customAudience.filter((tag) => tag !== tagToRemove);
                                            setCustomAudience(updatedTags);
                                        }}
                                    />
                                    {customAudience.length > 0 && <Box paddingTop={1}></Box>}
                                    <Input type="text" size="medium" placeholder="Target Audience" onKeyDown={(event) => customAudienceHandler(event)} />
                                </FormField>
                            </Cell>
                        )}

                        <Cell span={12}>
                            <FormField
                                label={
                                    <FloatingHelper
                                        opened={isHelperOpen && helperStep === (!content ? 7 : 6)}
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="Select Language"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box direction="vertical" gap="20px">
                                                        <Text size="small" light>
                                                            Select the language for the content to be generated
                                                        </Text>
                                                        <Box direction="horizontal" gap={"20px"}>
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="light"
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
                                statusMessage="For optimal results use GPT-4o (Advanced version) when using non-English languages"
                                dataHook="gpt-language"
                            >
                                <AutoComplete
                                    placeholder="Select Language"
                                    maxHeightPixels="150px"
                                    options={languageOptions}
                                    selectedId={selectedLanguage}
                                    value={searchValue}
                                    onSelect={(option) => {
                                        setSearchValue(option.value);
                                        setSelectedLanguage(option.id);
                                        setFullLanguageName(option.value);
                                    }}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    predicate={(option) => includesCaseInsensitive(option.value, searchValue.trim())}
                                />
                            </FormField>
                        </Cell>

                        <Cell span={12}>
                            <FormField
                                label={
                                    <FloatingHelper
                                        opened={isHelperOpen && helperStep === (!content ? 8 : 7)}
                                        width={"280px"}
                                        onClose={helperClose}
                                        target="ChatGPT Version"
                                        content={
                                            <FloatingHelper.Content
                                                body={
                                                    <Box direction="vertical" gap="20px">
                                                        <Text size="small" light>
                                                            {" "}
                                                            Select the ChatGPT version to use{" "}
                                                        </Text>
                                                        <Text size="small" light>
                                                            4-mini (Efficient version): Faster, versatile model for quick and reliable content generation.
                                                        </Text>
                                                        <Text size="small" light>
                                                            4o (Advanced version): Latest model with high-quality translation and the most up-to-date features.
                                                        </Text>
                                                        <Box direction="horizontal" gap={"20px"}>
                                                            <Button
                                                                onClick={() => {
                                                                    handlePreviousActionClick();
                                                                }}
                                                                skin="light"
                                                                size="small"
                                                                priority="secondary"
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleHelperActionClick();
                                                                }}
                                                                skin="light"
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
                                    selectedVersion == "4-mini"
                                        ? "Faster, versatile model for quick and reliable content generation."
                                        : "Latest model with high-quality translation and the most up-to-date features."
                                }
                                dataHook="gpt-version"
                            >
                                <Dropdown selectedId={selectedVersion} options={versionOptions} onSelect={handleSelectVersion} />
                            </FormField>
                            <Text weight="bold">{selectedVersion == "4-mini" ? "1-2 tokens per word" : "2-3 tokens per word"}</Text>
                        </Cell>

                        <Cell span={12}>
                            <FloatingHelper
                                opened={isHelperOpen && helperStep === (!content ? 9 : 8)}
                                width={"280px"}
                                onClose={helperClose}
                                target={
                                    !warningIsOpen ? (
                                        <Button size="medium" dataHook="gpt-product-generate-button" onClick={generateButton}>
                                            {observerLoader ? <Loader size="tiny" /> : "Generate Blog Post"}
                                        </Button>
                                    ) : (
                                        <SectionHelper appearance="warning" dataHook="gpt-warning">
                                            <Layout>
                                                <Cell span={12}>
                                                    <Box direction="vertical">
                                                        <Text>The content of the current blog will be overwritten</Text>
                                                    </Box>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Box direction="horizontal" width={"100%"} gap={"10px"}>
                                                        <Button onClick={() => setWarningIsOpen(false)} priority="secondary">
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={generateButtonHandlerWrapper}>{observerLoader ? <Loader size="tiny" /> : "Continue"}</Button>
                                                    </Box>
                                                </Cell>
                                            </Layout>
                                        </SectionHelper>
                                    )
                                }
                                content={
                                    <FloatingHelper.Content
                                        body={
                                            <Box direction="vertical" gap={"20px"}>
                                                <Text size="small" light>
                                                    After entering all the information and selecting the desired settings, click on Generate Blog Post
                                                </Text>
                                                <Box direction="horizontal" gap={"20px"}>
                                                    <Button
                                                        onClick={() => {
                                                            handlePreviousActionClick();
                                                        }}
                                                        skin="light"
                                                        size="small"
                                                        priority="secondary"
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            handleHelperActionClick();
                                                        }}
                                                        skin="light"
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
                        </Cell>
                        {!warningIsOpen ? <Box paddingTop={"50px"}></Box> : <Box paddingTop={"25px"}></Box>}
                    </Layout>
                </Box>
            </Card>
        </ThemeProvider>
    );
};
