axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
import { observeState } from '@wix/dashboard-sdk';
import { showToast } from '@wix/dashboard-sdk';
import axios from 'axios';
import { FC, useEffect, useState } from 'react';
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
} from 'wix-style-react';
import { theme } from 'wix-style-react/themes/businessDashboard';
import CONFIG from '../data/app-config';
import { getInstance, getAdminKey } from '../data/utils';
import { CrashedApp, InstallationError, PageLoader } from './WarningScreens/WarningScreens';
import { RichContent } from 'ricos-schema';
import { Node, Node_Type  } from 'ricos-schema';

export interface DashboardWidgetProps {
    onLoaded?: () => void;
}

export const Widget: FC = () => {
    const [isAppCrashed, setIsAppCrashed] = useState(false);
    const [appData, setAppData] = useState(false);
    const [genButtonLoading, setGenButtonLoading] = useState(false);
    const [wordsNum, setWordsNum] = useState<number>(100);
    const [draftName, setDraftName] = useState<string>('');
    const [postContent, setPostContent] = useState<RichContent>({ nodes: [] });

    useEffect(() => {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const instance = params.get('instance');

        axios
            .post(CONFIG.ajaxUrl, {
                instance: instance,
                action: 'getAppData',
                k: getAdminKey(),
            })
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                if (!data || typeof data.instance_id === 'undefined') {
                    setIsAppCrashed(true);
                } else {
                    setAppData(data);
                }
            })
            .catch((error) => {
                console.log('error from receiveing appData', error);
                setIsAppCrashed(true);
            });
    }, []);

    const observerCallback = (state: any, envData: any) => {
        console.log('Received state:', state);
        console.log('Received envData:', envData);
        const postTitle = state.getPostTitle();
        postTitle.then((postTitle: string) => {
            setDraftName(postTitle);
        });

        if (postContent) {
            console.log("postContent", postContent)
            state.setPostContent(postContent);
        }
    };

    useEffect(() => {
        observeState(observerCallback);
    }, [postContent]);

    const [additionalInfo, setAdditionalInfo] = useState('');
    const [selectedWritingStyle, setSelectedWritingStyle] = useState<number>(0);
    const [customStyle, setCustomStyle] = useState<string>('');
    const writingStylesOptions = [
        {
            id: 0,
            value: 'Conversational',
            description:
                "Uses a friendly, casual tone that makes the reader feel like you're speaking directly to them. This approach helps build rapport and trust with potential customers.",
        },
        {
            id: 1,
            value: 'Professional',
            description:
                'Maintains a polished and formal tone that conveys expertise and credibility. This style is suitable for high-end or technical products where professionalism is crucial.',
        },
        {
            id: 2,
            value: 'Informative',
            description:
                "Provides clear, concise information about the product's features, benefits, and specifications to help readers make informed purchasing decisions.",
        },
        {
            id: 3,
            value: 'Storytelling',
            description:
                'Creates a narrative around the product, highlighting its origin, the people who created it, or the problem it solves to engage readers emotionally.',
        },
        {
            id: 4,
            value: 'Humorous',
            description:
                'Injects wit, puns, or jokes into your description to entertain readers and make your product memorable.',
        },
        {
            id: 5,
            value: 'Persuasive',
            description:
                "Focuses on the unique selling points of the product and use persuasive language to convince readers that it's the best choice for them.",
        },
        {
            id: 6,
            value: 'Emotional',
            description:
                "Taps into the reader's emotions by describing how the product will make them feel, improve their lives, or solve their problems.",
        },
        {
            id: 7,
            value: 'Sensory',
            description:
                "Uses vivid, sensory language to help readers imagine what it's like to use the product, appealing to their senses of sight, touch, taste, smell, and sound.",
        },
        {
            id: 8,
            value: 'Comparative',
            description:
                'Compares your product to similar products on the market, highlighting its advantages and unique features.',
        },
        { id: 9, value: 'Custom', description: '20 letters max' },
    ];

    const [selectedVersion, setSelectedVersion] = useState<number>(0);
    const versionOptions = [
        { id: 0, value: '3.5: Basic Version' },
        { id: 1, value: '4: Advanced Version' },
    ];

    const [customAudience, setCustomAudience] = useState<string>('');
    const [selectedOptions, setSelectedOptions] = useState<number[]>([0]);
    const serviceOptions = [
        { id: 0, value: 'General (Not specific to any group)' },
        { id: 1, value: 'Generation Alpha (Born 2013 onwards)' },
        { id: 2, value: 'Generation Z (Born 1997-2012)' },
        { id: 3, value: 'Millennials (Born 1981-1996)' },
        { id: 4, value: 'Generation X (Born 1965-1980)' },
        { id: 5, value: 'Baby Boomers (Born 1946-1964)' },
        { id: 6, value: 'Silent Generation (Born 1928-1945)' },
        { id: 7, value: 'New Parents' },
        { id: 8, value: 'Fitness Enthusiasts' },
        { id: 9, value: 'Pet Owners' },
        { id: 10, value: 'Tech-savvy' },
        { id: 11, value: 'Music Enthusiasts' },
        { id: 12, value: 'Sports Fans' },
        { id: 13, value: 'Soccer Moms' },
        { id: 14, value: 'Outdoor Adventures' },
        { id: 15, value: 'Wellness Seekers' },
        { id: 16, value: 'Students' },
        { id: 17, value: 'Foodies' },
        { id: 18, value: 'Travel Buffs' },
        { id: 19, value: 'Home Decor Enthusiasts' },
        { id: 20, value: 'Beautyand Skincare Aficionados' },
        { id: 21, value: 'Video Gamers' },
        { id: 22, value: 'Custom' },
    ].map((option) => ({
        ...option,
        disabled: option.id === 0 ? selectedOptions.length > 0 : false,
    }));

    useEffect(() => {
        if (selectedOptions.length > 1 && selectedOptions.includes(0)) {
            setSelectedOptions((prevOptions) => prevOptions.filter((option) => option !== 0));
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

    const handleCustomStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomStyle(e.target.value);
    };

    const handleCustomAudienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAudience(e.target.value);
    };

    const handleWordsNumChange = (value: number | null) => {
        setWordsNum(value ?? 0);
    };

    const handleAdditionalInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAdditionalInfo(e.target.value);
    };

    const generateButtonHandler = (event: { preventDefault: () => void }) => {
        event.preventDefault();

        setGenButtonLoading(true);
        axios
            .post(CONFIG.ajaxUrl, {
                instance: getInstance(),
                action: 'generateBlogDescription',
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
                if (response.data.response) {
                    const responseData = response.data.response;
                    const paragraphs = responseData.split("\n\n").map((paragraph: string) => ({
                        type: Node_Type.PARAGRAPH,
                        id: 'unique_paragraph_id', 
                        nodes: [
                            {
                                textData: {
                                    text: paragraph,
                                    decorations: [],
                                }
                            }
                        ]
                    }));
                    const newRichContent: RichContent = {
                        nodes: paragraphs
                    };
                    console.log("newRichContent", newRichContent);
                    setPostContent(newRichContent);
                    observeState(observerCallback);
                }
                return response.data;
            })
            .then((data) => {
                if (!data || data.error) {
                    if (data.error) {
                        showToast({
                            message: data.error,
                            type: 'error',
                        });
                    } else {
                        showToast({
                            message: 'Something went wrong, please refresh the page and try again.',
                            type: 'error',
                        });
                    }
                } else {
                    showToast({
                        message: `Content successfully generated, ${data.currentTokensUsage} tokens used.`,
                        type: 'success',
                    });
                }
                setGenButtonLoading(false);
            })
            .catch((error) => {
                showToast({
                    message: 'Something went wrong, please refresh the page and try again.',
                    type: 'error',
                });
                console.log('error genrating button:', error);
                setGenButtonLoading(false);
            });
    };

    if (isAppCrashed) {
        return <CrashedApp />;
    }

    if (!appData) {
        return <PageLoader />;
    }

    //TODO: DO NOT FORGET TO COMMENT OUT WHEN PUSH
    // if ((appData as any)?.instance_id === false) {
    //     return <InstallationError />;
    // }

    return (
        <ThemeProvider theme={theme({ active: true })}>
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
                                        ? 'Each word uses approximately 1-2 tokens).'
                                        : 'Each word uses approximately 5-10 tokens).'
                                }
                            >
                                <NumberInput
                                    value={wordsNum}
                                    onChange={handleWordsNumChange}
                                    min={0}
                                />
                            </FormField>
                        </Cell>
                        <Cell span={selectedWritingStyle !== 9 ? 12 : 6}>
                            <FormField
                                label="Writing Style (Voice)"
                                statusMessage={
                                    writingStylesOptions[selectedWritingStyle].description
                                }
                            >
                                <Dropdown
                                    selectedId={selectedWritingStyle}
                                    options={writingStylesOptions}
                                    onSelect={handleSelectWritingStyle}
                                />
                            </FormField>
                        </Cell>
                        {selectedWritingStyle === 9 && (
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
                                        setSelectedOptions([...selectedOptions, Number(option)])
                                    }
                                    onDeselect={(option) =>
                                        setSelectedOptions(
                                            selectedOptions.filter(
                                                (item) => item !== Number(option)
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
                                        ? 'GPT-3.5 provides proficient text generation with a solid foundation of understanding and creativity.'
                                        : 'GPT-4 offers enhanced understanding, more coherent responses, and an improved ability to provide detailed and accurate information.'
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
                                    ? '1-2 tokens per word'
                                    : '5-10 tokens per word'}
                            </Text>
                        </Cell>
                        <Cell span={12}>
                            <Button
                                size="medium"
                                dataHook="gpt-product-generate-button"
                                onClick={generateButtonHandler}
                            >
                                {genButtonLoading ? <Loader size="tiny" /> : 'Generate Description'}
                            </Button>
                        </Cell>
                    </Layout>
                </Box>
            </Card>
        </ThemeProvider>
    );
};
