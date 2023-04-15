import './App.css';
import EmailEditor from 'react-email-editor';
import { useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { newTemplateDesign, sample } from "./sample";
import { AiOutlineTablet, AiOutlineDesktop, AiOutlineMobile } from 'react-icons/ai';
import { VscSave, VscTrash, VscDesktopDownload, VscRocket, VscNewFile } from "react-icons/vsc";

function App() {
    const apiEndpoint = "https://gdzavroudg.execute-api.ap-southeast-1.amazonaws.com/"
    const emailEditorRef = useRef(null);
    const [preview, setPreview] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [allTemplates, setAllTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = 'Are you sure you want to leave?';
        };

        const handleUnload = (event) => {
            if (event.returnValue === '') {
                console.log('User canceled the prompt and decided to stay on the page.');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, []);

    useEffect(() => {
        // find savedTemplates and log the values - for dropdown
        const savedTemplates = Object.keys(localStorage).filter(key => key.endsWith('.json'));
        setTemplates(savedTemplates);

        fetchData()
    }, []);

    async function fetchData(name = '', selectTemplate = false) {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json()

            if (name && selectTemplate) {
                const getNewTemplate = data.find(template => template.name === name)
                setSelectedTemplate(getNewTemplate)
            }
            setAllTemplates(data)

            if (response.status === 429) {
                const { error } = await response.json();
                console.log(error)
                alert(error);
            }
        } catch (e) {
            console.log('e', e);
        } finally {
            console.log('get all templates');
        }
    }

    const selectTemplate = (event) => {
        const selectedTemplateId = event.target.value;
        const getTemplate = allTemplates.find(template => template.templateId === selectedTemplateId)
        setSelectedTemplate(getTemplate);

        // change page title to template name
        document.title = 'Editing : ' + getTemplate.name;
    };

    const exportHtml = (e) => {
        emailEditorRef.current?.editor?.exportHtml(async (data) => {
            const { html } = data;

            // export as HTML file as downloadable to root folder called email-template
            const fileName = 'email-template.html';
            const blob = new Blob([html], { type: 'text/html' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const sendEmail = (e) => {
        emailEditorRef.current?.editor?.exportHtml(async (data) => {
            const { html } = data;

            try {
                e.preventDefault();

                const response = await fetch(apiEndpoint + "email", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        html
                    }),
                });

                if (response.status === 429) {
                    const { error } = await response.json();
                    console.log(error)
                    alert(error);
                }
            } catch (e) {
                console.log('e', e);
            } finally {
                toast.success('Email sent successfully!');
            }

        });
    };

    const togglePreviewDesktop = () => {
        // trigger preview for dekstop
        emailEditorRef.current?.editor?.showPreview('desktop');
    };
    
    const togglePreviewTablet = () => {
        emailEditorRef.current?.editor?.showPreview('tablet');
    };

    const togglePreviewMobile = () => {
        emailEditorRef.current?.editor?.showPreview('mobile');
    };

    const newTemplate = async (e) => {
        // ask for template name
        let name = prompt('Enter template name:', 'template.json');

        if (!name) {
            return;
        }

        // load empty design
        emailEditorRef.current?.editor?.loadDesign(newTemplateDesign);

        try {
            e.preventDefault();

            let getDuplicatedTemplateName = false
            do {
                getDuplicatedTemplateName = allTemplates.some(template => template.name === name)
                if (!getDuplicatedTemplateName) {
                    break
                }

                name = prompt('Please enter a different name:', name)
                if (name === null) {
                    return new Error('Can\'t have duplicated name')
                }
            } while (getDuplicatedTemplateName === true);


            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    data: newTemplateDesign
                }),
            });

            if (response.status === 429) {
                const { error } = await response.json();
                console.log(error)
                alert(error);
            }

            await fetchData(name, true)

            // update dropdown
            const dropdown = document.getElementById('select-design');
            const option = document.createElement('option');
            option.value = name;
            option.text = name;
            dropdown.add(option, 0);
            // set dropdown value to new template
            dropdown.value = name;

            toast.success('Design saved to database');
        } catch (e) {
            console.log('e', e);
        }
    };

    const onReady = () => {
        if (selectedTemplate) {
            emailEditorRef.current?.editor?.loadDesign(JSON.parse(selectedTemplate.data));
        } else {
            emailEditorRef.current?.editor?.loadDesign(sample);
        }
    };

    const deleteTemplate = async () => {
        const name = selectedTemplate ? selectedTemplate.name : null;

        if (!name) {
            return;
        }
        
        // // ask if user wants to delete template
        window.confirm(`Are you sure you want to delete ${selectedTemplate.name}?`);


        // remove template from local storage
        const response = await fetch(`${apiEndpoint}/${selectedTemplate.templateId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 429) {
            const { error } = await response.json();
            console.log(error)
            alert(error);
        }

        await fetchData()

        // load sample design
        emailEditorRef.current?.editor?.loadDesign(sample);

        // set selected template to null
        setSelectedTemplate(null);

        // update dropdown
        const dropdown = document.getElementById('select-design');
        dropdown.remove(dropdown.selectedIndex);

        // set dropdown value to first template
        dropdown.value = dropdown.options[0].value;
    };

    async function saveTemplateToDatabase(e) {
        if (!selectedTemplate) {
            alert('Please create a template first');
            return
        }

        emailEditorRef.current?.editor?.saveDesign(async (design) => {
            try {
                e.preventDefault();
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        templateId: selectedTemplate.templateId,
                        name: selectedTemplate.name,
                        data: design
                    }),
                });

                if (response.status === 429) {
                    const { error } = await response.json();
                    console.log(error)
                    alert(error);
                }

                await fetchData(selectedTemplate.name ,true)
            } catch (e) {
                console.log(e)
                console.log('e', e);
            } finally {
                toast.success('Design saved to databse');
            }
        })
    }

    return (
        <div className="App bg-black text-slate-12 font-sans">
            <Toaster />

            <div className="flex flex-col justify-between">
                <nav className="p-3 flex justify-between items-center gap-3 sticky">
                    <div className='flex gap-3 items-center'>
                        <div>
                            <select onChange={selectTemplate} id="select-design" name="select-design" class="block flex-1 py-2.5 px-0 w-full text-sm text-gray-200 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer">
                                <option selected disabled>Select template</option>
                                {allTemplates.map((template) => (
                                    <option key={template.templateId} value={template.templateId}>{template.name}</option>
                                ))}
                            </select>
                        </div>

                        <button type="button" onClick={deleteTemplate} class="text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-[10px] px-4 py-2 text-center items-center dark:focus:ring-gray-500 flex gap-2">
                            <VscTrash className="w-4 h-4" />
                        </button>

                        <button type="button" onClick={newTemplate} class="text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-[10px] px-4 py-2 text-center items-center dark:focus:ring-gray-500 flex gap-2">
                            <VscNewFile className="w-4 h-4" />
                        </button>
                    </div>

                    <div className='flex gap-3'>
                        <div className="inline-flex rounded-md shadow-sm justify-center" role="group">
                            <button type="button" onClick={togglePreviewDesktop} class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                                <AiOutlineDesktop className="w-4 h-4 mr-2 fill-current" />
                            </button>

                            <button type="button" onClick={togglePreviewTablet} class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                                <AiOutlineTablet className="w-4 h-4 mr-2 fill-current" />
                            </button>

                            <button type="button" onClick={togglePreviewMobile} class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                                <AiOutlineMobile className="w-4 h-4 mr-2 fill-current" />
                            </button>
                        </div>

                        <button type="button" onClick={saveTemplateToDatabase} class="text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-[10px] px-4 py-2 text-center items-center dark:focus:ring-gray-500 flex gap-2">
                            <VscSave className="w-4 h-4" />
                        </button>
                    </div>

                    <div className='flex gap-2'>
                        <button type="button" onClick={exportHtml} class="text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-[10px] px-4 py-2 text-center items-center dark:focus:ring-gray-500 flex gap-2">
                            <span className="hidden md:block">Download HTML</span>
                            <VscDesktopDownload className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={sendEmail} class="text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-[10px] px-4 py-2 text-center items-center dark:focus:ring-gray-500 flex gap-2">
                            <span className="hidden md:block">Send Email</span>
                            <VscRocket className="w-4 h-4" />
                        </button>
                    </div>
                </nav>

                <main className='flex h-full bg-black'>
                    <EmailEditor
                        ref={emailEditorRef}
                        onReady={onReady}
                        projectId={151763}
                        options={{
                            appearance: {
                                theme: "dark",
                                panels: {
                                    tools: {
                                        dock: "right",
                                        hidden: false,
                                    },
                                },
                            },
                            features: {
                                textEditor: {
                                    // fontSizes: ["70px", "60px", "50px"],
                                },
                            },
                            fonts: {
                                showDefaultFonts: false,
                                customFonts: [
                                    // paid feature
                                    // {
                                    // 	label: "Comic Sans",
                                    // 	value: "'Comic Sans MS', cursive, sans-serif",
                                    // },
                                    // {
                                    // 	label: "DotGothic16",
                                    // 	value: "'DotGothic16',cursive",
                                    // 	url: "https://fonts.googleapis.com/css?family=DotGothic16",
                                    // },
                                ],
                            },
                        }}
                    />
                </main>
            </div>

        </div>
    );
}

export default App;