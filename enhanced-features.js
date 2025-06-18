// Enhanced Features JavaScript Implementation
document.addEventListener('DOMContentLoaded', function() {
    // --- DATA STORAGE ---
    let prospects = [];
    let clients = [];
    let tasks = [];
    let quickNotes = [];
    let emailTemplates = [];
    let currentView = 'prospects';
    let selectedTaskIds = new Set();
    let currentEditingPerson = null;
    
    // Default email templates
    const defaultTemplates = [
        {
            id: 'template-1',
            name: 'Initial Contact',
            subject: 'Insurance Quote Request - {{name}}',
            content: 'Dear {{name}},\n\nThank you for your interest in our insurance services. I would be happy to provide you with a personalized quote.\n\nCould we schedule a brief call to discuss your needs?\n\nBest regards,\n[Your Name]',
            category: 'introduction'
        },
        {
            id: 'template-2',
            name: 'Follow-up After Quote',
            subject: 'Following up on your insurance quote',
            content: 'Hi {{name}},\n\nI wanted to follow up on the quote I sent you last week. Do you have any questions about the coverage or pricing?\n\nI\'m available for a call at your convenience.\n\nBest regards,\n[Your Name]',
            category: 'follow-up'
        },
        {
            id: 'template-3',
            name: 'Policy Renewal Reminder',
            subject: 'Your policy renewal is approaching',
            content: 'Dear {{name}},\n\nYour insurance policy is due for renewal on [date]. I\'d like to review your coverage to ensure it still meets your needs.\n\nPlease let me know a good time to discuss.\n\nBest regards,\n[Your Name]',
            category: 'renewal'
        }
    ];

    // --- DOM ELEMENTS ---
    const prospectsContainer = document.getElementById('prospectsContainer');
    const clientsContainer = document.getElementById('clientsContainer');
    const tasksContainer = document.getElementById('tasksContainer');
    const templatesContainer = document.getElementById('templatesContainer');
    const quickNotesCount = document.getElementById('quickNotesCount');
    
    const prospectModal = document.getElementById('prospectModal');
    const prospectForm = document.getElementById('prospectForm');
    const modalTitle = document.getElementById('modalTitle');
    const prospectIdInput = document.getElementById('prospectId');

    const taskModal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');
    const taskModalTitle = document.getElementById('taskModalTitle');
    const taskIdInput = document.getElementById('taskId');
    const taskLinkSelect = document.getElementById('taskLink');
    
    const quickNoteModal = document.getElementById('quickNoteModal');
    const quickNoteForm = document.getElementById('quickNoteForm');
    
    const templateModal = document.getElementById('templateModal');
    const templateForm = document.getElementById('templateForm');
    
    const communicationModal = document.getElementById('communicationModal');
    const communicationForm = document.getElementById('communicationForm');
    
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');

    const tabs = {
        prospects: document.getElementById('prospectsTab'),
        clients: document.getElementById('clientsTab'),
        tasks: document.getElementById('tasksTab'),
        analytics: document.getElementById('analyticsTab'),
        pipeline: document.getElementById('pipelineTab'),
        comparison: document.getElementById('comparisonTab'),
        templates: document.getElementById('templatesTab')
    };
    
    const panes = {
        prospects: document.getElementById('prospectsView'),
        clients: document.getElementById('clientsView'),
        tasks: document.getElementById('tasksView'),
        analytics: document.getElementById('analyticsView'),
        pipeline: document.getElementById('pipelineView'),
        comparison: document.getElementById('comparisonView'),
        templates: document.getElementById('templatesView')
    };
    
    // Chart instances
    let prospectsClientsChart = null;
    let taskStatusChart = null;
    let monthlyActivityChart = null;

    // --- DATA HANDLING ---
    function loadData() {
        prospects = JSON.parse(localStorage.getItem('prospects')) || [];
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        quickNotes = JSON.parse(localStorage.getItem('quickNotes')) || [];
        emailTemplates = JSON.parse(localStorage.getItem('emailTemplates')) || defaultTemplates;
        
        // Ensure all prospects/clients have required fields
        [...prospects, ...clients].forEach(person => {
            if (!person.communications) person.communications = [];
            if (!person.activities) person.activities = [];
        });
        
        updateQuickNotesCount();
    }

    function saveData() {
        localStorage.setItem('prospects', JSON.stringify(prospects));
        localStorage.setItem('clients', JSON.stringify(clients));
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('quickNotes', JSON.stringify(quickNotes));
        localStorage.setItem('emailTemplates', JSON.stringify(emailTemplates));
        renderAll();
    }

    // --- RENDER FUNCTIONS ---
    function renderAll() {
        const searchTerm = searchInput.value.toLowerCase();
        renderProspects(searchTerm);
        renderClients(searchTerm);
        renderTasks(searchTerm);
        renderEmailTemplates();
        if (currentView === 'analytics') renderAnalytics();
        if (currentView === 'pipeline') renderPipeline();
        if (currentView === 'comparison') renderQuoteComparison();
    }
    
    const getStatusClass = (status) => {
        const statusMap = {
            'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'follow-up': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            'interested': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'not interested': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            'converted': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
            'needs analysis': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
            'proposal sent': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
            'negotiation': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            'won': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
            'lost': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
            'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    function createPersonCard(person, type) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-5 flex flex-col';
        card.setAttribute('data-id', person.id);

        const tagsHTML = (person.tags || []).map(tag => 
            `<span class="bg-gray-200 dark:bg-gray-700 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${tag}</span>`
        ).join('');
        
        // Enhanced details with communication summary
        let detailsHTML = `
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div class="font-semibold text-gray-500 dark:text-gray-400">Quote Status</div>
                <div>${person['quote-status'] || 'N/A'}</div>
                <div class="font-semibold text-gray-500 dark:text-gray-400">Quoted Premium</div>
                <div>${person['quoted-premium'] ? '$' + person['quoted-premium'] : 'N/A'}</div>
                <div class="font-semibold text-gray-500 dark:text-gray-400">Policy Type</div>
                <div>${person['policy-type'] || 'N/A'}</div>
            </div>
        `;

        if (type === 'client') {
            detailsHTML += `
            <div class="border-t dark:border-gray-600 my-2"></div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div class="font-semibold text-gray-500 dark:text-gray-400">Policy #</div>
                <div>${person['policy-number'] || 'N/A'}</div>
                <div class="font-semibold text-gray-500 dark:text-gray-400">Renewal</div>
                <div>${person['renewal-date'] || 'N/A'}</div>
                <div class="font-semibold text-gray-500 dark:text-gray-400">Premium</div>
                <div>${person['premium-amount'] ? '$' + person['premium-amount'] : 'N/A'}</div>
            </div>
            `;
        }
        
        // Add communication summary
        const recentComms = (person.communications || []).slice(-3);
        if (recentComms.length > 0) {
            detailsHTML += `
            <div class="border-t dark:border-gray-600 my-2"></div>
            <div class="text-sm">
                <h6 class="font-semibold text-gray-600 dark:text-gray-400 mb-2">Recent Communications</h6>
                <div class="space-y-1">
                    ${recentComms.map(comm => `
                        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <span class="mr-2">${getCommIcon(comm.type)}</span>
                            <span class="flex-1">${comm.summary}</span>
                            <span>${new Date(comm.date).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            `;
        }
        
        // Quick actions
        const quickActions = `
            <div class="mt-3 flex flex-wrap gap-2">
                <button class="quick-email-btn text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition" title="Send Email">
                    <i class="fas fa-envelope"></i> Email
                </button>
                <button class="quick-call-btn text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition" title="Log Call">
                    <i class="fas fa-phone"></i> Call
                </button>
                <button class="quick-task-btn text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition" title="Create Task">
                    <i class="fas fa-tasks"></i> Task
                </button>
                ${person.quickNotes && person.quickNotes.length > 0 ? 
                    `<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        <i class="fas fa-sticky-note"></i> ${person.quickNotes.length} Notes
                    </span>` : ''
                }
            </div>
        `;

        card.innerHTML = `
            <div class="flex-grow cursor-pointer card-header">
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">${person.name}</h3>
                    <div class="status-tag ${getStatusClass(person.status)}">${person.status}</div>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${person.email || ''}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${person.phone || ''}</p>
                <div class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    <p class="whitespace-pre-wrap">${person.notes || ''}</p>
                </div>
                <div class="mt-4">${tagsHTML}</div>
            </div>
            
            <div class="card-details border-t dark:border-gray-700">
               ${detailsHTML}
               ${quickActions}
            </div>

            <div class="border-t dark:border-gray-700 mt-4 pt-4 flex justify-between items-center">
                <span class="text-xs text-gray-400">ID: ${person.id.substring(0,8)}</span>
                <div class="flex space-x-2">
                     ${type === 'prospect' ? 
                        `<button class="convert-btn text-green-500 hover:text-green-700" title="Convert to Client">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.0001 16.1716L18.3641 10.8076L19.7783 12.2218L13.0001 19L6.22187 12.2218L7.63609 10.8076L13.0001 16.1716Z"></path>
                                <path d="M13 3V16H11V3H13Z"></path>
                            </svg>
                        </button>` : ''
                     }
                    <button class="edit-btn text-blue-500 hover:text-blue-700" title="Edit">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.7279 9.57629L14.3137 8.16207L5 17.4758V19H6.52423L15.7279 9.57629ZM17.1421 8.16207L18.5563 6.74785L17.1421 5.33363L15.7279 6.74785L17.1421 8.16207ZM7.23223 21H3V16.7678L14.3137 5.45408C14.8995 4.86829 15.849 4.86829 16.4348 5.45408L18.5563 7.5756C19.1421 8.16139 19.1421 9.11086 18.5563 9.69665L7.23223 21Z"></path>
                        </svg>
                    </button>
                    <button class="delete-btn text-red-500 hover:text-red-700" title="Delete">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Event listeners
        card.querySelector('.card-header').addEventListener('click', () => {
            card.querySelector('.card-details').classList.toggle('expanded');
        });
        card.querySelector('.edit-btn').addEventListener('click', () => openProspectModal(person, type));
        card.querySelector('.delete-btn').addEventListener('click', () => deletePerson(person.id, type));
        
        if (type === 'prospect') {
            card.querySelector('.convert-btn').addEventListener('click', () => convertToClient(person.id));
        }
        
        // Quick action listeners
        card.querySelector('.quick-email-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openEmailTemplateSelector(person);
        });
        
        card.querySelector('.quick-call-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            logQuickCall(person, type);
        });
        
        card.querySelector('.quick-task-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            createQuickTask(person, type);
        });
        
        return card;
    }
    
    function getCommIcon(type) {
        const icons = {
            call: '<i class="fas fa-phone text-green-500"></i>',
            email: '<i class="fas fa-envelope text-blue-500"></i>',
            meeting: '<i class="fas fa-users text-purple-500"></i>',
            note: '<i class="fas fa-sticky-note text-yellow-500"></i>'
        };
        return icons[type] || '<i class="fas fa-comment text-gray-500"></i>';
    }