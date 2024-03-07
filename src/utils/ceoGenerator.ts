import { exec } from "child_process";

interface ProjectData {
    institutionId: number;
    projectTemplate: number;
    useTemplatePlots: boolean;
    useTemplateWidgets: boolean;
    imageryId: number;
    projectImageryList: number[];
    aoiFeatures: any[];
    aoiFileName: string;
    description: string;
    name: string;
    privacyLevel: string;
    projectOptions: {
        showGEEScript: boolean;
        showPlotInformation: boolean;
        collectConfidence: boolean;
        autoLaunchGeoDash: boolean;
    };
    designSettings: {
        userAssignment: {
            userMethod: string;
            users: any[];
            percents: any[];
        };
        qaqcAssignment: {
            qaqcMethod: string;
            percent: number;
            smes: any[];
            timesToReview: number;
        };
        sampleGeometries: {
            points: boolean;
            lines: boolean;
            polygons: boolean;
        };
    };
    numPlots: string;
    plotDistribution: string;
    plotShape: string;
    plotSize: string;
    plotSpacing: string;
    shufflePlots: boolean;
    sampleDistribution: string;
    samplesPerPlot: string;
    sampleResolution: string;
    allowDrawnSamples: boolean;
    surveyQuestions: any;
    surveyRules: any[];
    plotFileName: string;
    plotFileBase64: string;
}

async function login(email: string, password: string, url: string): Promise<string | null> {
    const headers = { 'Content-Type': 'application/json' };
    const data = JSON.stringify({ email, password });

    try {
        const response = await fetch(url, { method: 'POST', headers, body: data });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const ring_session = response.headers.get('Set-Cookie')?.split(';')[0];
        return ring_session ?? null;
    } catch (e) {
        console.log(`HTTP Request failed: ${e}`);
        return null;
    }
}

async function sendProjectCreationRequest(data: any, cookie: string): Promise<number | null> {
    const url = 'https://app.collect.earth/create-project';
    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie
    };

    const jsonData = typeof data !== 'string' ? JSON.stringify(data) : data;

    try {
        const response = await fetch(url, { method: 'POST', headers, body: jsonData });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const body = await response.json();
        const { projectId } = body;
        return projectId;
    } catch (e) {
        console.log(`HTTP Request failed: ${e}`);
        throw new Error("There was a problem with the request to CEO.")
    }
}

async function buildAndSendProjectData(plotFileBase64: string): Promise<number | null> {

    try {
        if (process.env.CEO_EMAIL && process.env.CEO_PASSWORD) {
            const cookie = await login(process.env.CEO_EMAIL, process.env.CEO_PASSWORD, "https://app.collect.earth/login");

            if (!cookie) {
                console.log("Login failed.");
                return null;
            }

            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
            const project_name = `dpi_${timestamp}`;

            const data: ProjectData = {
                institutionId: 3878,
                projectTemplate: -1,
                useTemplatePlots: false,
                useTemplateWidgets: false,
                imageryId: 1317,
                projectImageryList: [1885],
                aoiFeatures: [],
                aoiFileName: "",
                description: "",
                name: project_name,
                privacyLevel: "users",
                projectOptions: {
                    showGEEScript: false,
                    showPlotInformation: true,
                    collectConfidence: false,
                    autoLaunchGeoDash: true,
                },
                designSettings: {
                    userAssignment: {
                        userMethod: "none",
                        users: [],
                        percents: [],
                    },
                    qaqcAssignment: {
                        qaqcMethod: "none",
                        percent: 0,
                        smes: [],
                        timesToReview: 2,
                    },
                    sampleGeometries: {
                        points: true,
                        lines: true,
                        polygons: true,
                    },
                },
                numPlots: "",
                plotDistribution: "shp",
                plotShape: "square",
                plotSize: "",
                plotSpacing: "",
                shufflePlots: false,
                sampleDistribution: "center",
                samplesPerPlot: "1",
                sampleResolution: "",
                allowDrawnSamples: false,
                surveyQuestions: {
                    "0": {
                        question: "Forest 2020",
                        answers: {
                            "0": {
                                answer: "Yes",
                                color: "#5eb273",
                                hide: false
                            },
                            "1": {
                                answer: "No",
                                color: "#d99c2e",
                                hide: false
                            }
                        },
                        parentQuestionId: -1,
                        parentAnswerIds: [],
                        dataType: "text",
                        hideQuestion: false,
                        componentType: "button",
                        cardOrder: 1
                    }
                },
                surveyRules: [],
                plotFileName: "test_ceo.zip",
                plotFileBase64: plotFileBase64
            };
            

            const projectId = await sendProjectCreationRequest(data, cookie);

            if (projectId) {
                console.log("Project creation request sent successfully.");
                await publishProject(projectId, cookie);
                return projectId;
            } else {
                throw new Error("Unsuccessful project creation request.");
            }
        } else {
            throw new Error("No CEO credentials provided.");
        }

    } catch (e) {
        console.log(e);
        throw new Error(`${e}`);
    }
}

async function publishProject(projectId: number, cookie: string): Promise<void> {
    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie
    };
    try {
        const response = await fetch(`https://app.collect.earth/publish-project?projectId=${projectId}&clearSaved=true`, { method: 'POST', headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    } catch (e) {
        console.log(`HTTP Request failed: ${e}`);
    }
}

export async function createCeoProject(token: string): Promise<string> {
    // Assuming the first command is not used since it's redefined before being used.
    const command = `${process.env.PYTHON_PATH} src/python/csvToBase64.py "temp/${token}-result.csv"`;

    return new Promise((resolve, reject) => {
        exec(command, async (error, stdout, stderr) => { 
            if (error) {
                console.error(`${error.message}`);
                reject(error.message);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
            }
            try {
                const shpBase64 = stdout.trim();
                const plotFileBase64 = `data:application/zip;base64,${shpBase64}`;
                const project_id = await buildAndSendProjectData(plotFileBase64);
                resolve(`https://app.collect.earth/collection?projectId=${project_id}`); // Use resolve to return the value
            } catch (err: any) {
                reject(err.message); // Make sure to reject the promise in case of errors
            }
        });
    });
}