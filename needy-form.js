// ===== CONFIGURATION =====
const CLOUD_FUNCTION_URL = 'https://us-central1-seva-connect-backend.cloudfunctions.net/registerNeedy';
const WHATSAPP_NUMBER = '919858105224';

// ===== STEP NAVIGATION =====
function goToStep(stepNumber) {
    // Validate current step first
    const currentStep = getCurrentStep();
    if (stepNumber > currentStep && !validateStep(currentStep)) {
        return; // Validation fail
    }

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    document.getElementById('step' + stepNumber).classList.add('active');

    // Update progress
    updateProgress(stepNumber);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If step 4, fill summary
    if (stepNumber === 4) fillSummary();
}

function getCurrentStep() {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    for (let i = 0; i < steps.length; i++) {
        if (document.getElementById(steps[i]).classList.contains('active')) {
            return i + 1;
        }
    }
    return 1;
}

function updateProgress(step) {
    const percentages = { 1: 25, 2: 50, 3: 75, 4: 100 };
    document.getElementById('progressFill').style.width = percentages[step] + '%';

    // Update dots
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('dot' + i);
        dot.classList.remove('active', 'done');
        if (i < step) dot.classList.add('done');
        if (i === step) dot.classList.add('active');
    }
}

// ===== VALIDATION =====
function validateStep(stepNum) {
    let valid = true;

    if (stepNum === 1) {
        if (!validateNameField()) valid = false;
        if (!validatePhoneField()) valid = false;
        if (!validateEmailField()) valid = false;
        if (!validateCityField()) valid = false;
        if (!validateStateField()) valid = false;
        if (!validatePincodeField()) valid = false;
    }

    if (stepNum === 2) {
        // Category
        if (!validateCategoryField()) valid = false;

        // Story
        const story = document.getElementById('story').value.trim();
        const wordCount = story.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 80) {
            valid = false;
            alert('Apni kahani thodi aur detail mein likhiye (kam se kam 80 words)');
        }

        // Amount
        const amount = document.querySelector('input[name="amountRange"]:checked');
        if (!amount) {
            valid = false;
            alert('Approximate amount select karo');
        }
    }

    if (stepNum === 4) {
        // Video ya Document mein se kam se kam ek zaroori hai
        const youtubeBodyVisible = document.getElementById('youtubeBody')?.style.display === 'block';
        const whatsappBodyVisible = document.getElementById('whatsappBody')?.style.display === 'block';
        const youtubeLink = document.getElementById('youtubeLink')?.value.trim();
        const docChoice = document.querySelector('input[name="docChoice"]:checked')?.value;
        const documentLink = document.getElementById('documentLink')?.value.trim();

        const hasVideo = (youtubeBodyVisible && youtubeLink) || whatsappBodyVisible;
        const hasDocument = (docChoice === 'google-drive' && documentLink) || docChoice === 'whatsapp';

        if (!hasVideo && !hasDocument) {
            valid = false;
            alert('Verification ke liye video ya document mein se kam se kam ek dena zaroori hai — dono skip nahi kar sakte.');
        }

        // Terms
        if (!document.getElementById('terms1').checked ||
            !document.getElementById('terms2').checked ||
            !document.getElementById('terms3').checked) {
            valid = false;
            alert('Teeno terms agree karna zaroori hai');
        }
    }

    return valid;
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message;
}

function hideError(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = '';
}

// ===== PER-FIELD VALIDATORS (validateStep AND real-time blur/change dono use karte hain) =====
async function checkPhoneDuplicate(phone, formType, errorElId) {
    try {
        const res = await fetch(`https://us-central1-seva-connect-backend.cloudfunctions.net/checkDuplicatePhone?phone=${encodeURIComponent(phone)}&formType=${formType}`);
        const result = await res.json();
        if (result.duplicate) {
            showError(errorElId, result.error);
        }
    } catch (err) {
        // Silent fail — backend down hone par bhi user block nahi hona chahiye
    }
}

function validateNameField() {
    const name = document.getElementById('name').value.trim();
    if (!name || name.length < 2) {
        showError('nameError', 'Naam daalna zaroori hai');
        return false;
    }
    hideError('nameError');
    return true;
}

function validatePhoneField() {
    const phone = document.getElementById('phone').value.trim();
        if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
        showError('phoneError', 'Sahi 10 digit phone number daalo');
        return false;
    }
    hideError('phoneError');
    checkPhoneDuplicate(phone, 'needy', 'phoneError');
    return true;
}

function validateEmailField() {
    const email = document.getElementById('email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('emailError', 'Sahi email address daalna zaroori hai');
        return false;
    }
    hideError('emailError');
    return true;
}

function validateCityField() {
    const city = document.getElementById('city').value.trim();
    if (!city) {
        showError('cityError', 'Sheher (City) daalna zaroori hai');
        return false;
    }
    hideError('cityError');
    return true;
}

function validateStateField() {
    const state = document.getElementById('state').value;
    if (!state) {
        showError('stateError', 'State select karna zaroori hai');
        return false;
    }
    hideError('stateError');
    return true;
}

function validatePincodeField() {
    const pin = document.getElementById('pincode').value.trim();
    if (!pin || pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
        showError('pinError', 'Sahi 6 digit PIN code daalo');
        return false;
    }
    hideError('pinError');
    return true;
}

function validateCategoryField() {
    const category = document.querySelector('input[name="category"]:checked');
    if (!category) {
        showError('categoryError', 'Zarurat ki category select karo');
        return false;
    }
    hideError('categoryError');
    return true;
}

// ===== REAL-TIME VALIDATION LISTENERS =====
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('name').addEventListener('blur', validateNameField);
    document.getElementById('phone').addEventListener('blur', validatePhoneField);
    document.getElementById('email').addEventListener('blur', validateEmailField);
    document.getElementById('city').addEventListener('blur', validateCityField);
    document.getElementById('state').addEventListener('change', validateStateField);
    document.getElementById('pincode').addEventListener('blur', validatePincodeField);
    document.querySelectorAll('input[name="category"]').forEach(function (el) {
        el.addEventListener('change', validateCategoryField);
    });
});

// ===== CATEGORY SELECTION =====
function selectCategory(element, value) {
    // Remove all selected
    document.querySelectorAll('.category-select-item').forEach(item => {
        item.classList.remove('selected');
    });
    // Add selected to clicked
    element.classList.add('selected');
    hideError('categoryError');
}

// ===== AMOUNT SELECTION =====
function selectAmount(element, value) {
    document.querySelectorAll('.amount-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');

    const customDiv = document.getElementById('customAmountDiv');
    if (value === 'other') {
        customDiv.style.display = 'block';
    } else {
        customDiv.style.display = 'none';
    }
}

// ===== URGENCY SLIDER =====
function updateUrgency(value) {
    const labels = {
        1: '🟢 Kuch Samay Hai',
        2: '🟡 Moderate',
        3: '🟠 Jaldi Chahiye',
        4: '🔴 Urgent',
        5: '🚨 BAHUT URGENT'
    };
    document.getElementById('urgencyLabel').textContent = labels[value];
}

// ===== WORD COUNT =====
document.addEventListener('DOMContentLoaded', function () {
    const storyTextarea = document.getElementById('story');
    if (storyTextarea) {
        storyTextarea.addEventListener('input', function () {
            const words = this.value.trim().split(/\s+/).filter(w => w.length > 0);
            const count = words.length;
                        const counter = document.getElementById('wordCount');
            counter.textContent = count;
            counter.style.color = count >= 80 ? '#28A745' : '#FF6B35';
            const tip = document.getElementById('storyTip');
            if (tip) tip.style.display = (count >= 80 && count < 150) ? 'block' : 'none';
        });
    }
});

// ===== VIDEO OPTION SELECTION =====
function selectVideoOption(option) {
    // Hide all bodies
    document.getElementById('youtubeBody').style.display = 'none';
    document.getElementById('whatsappBody').style.display = 'none';
    document.getElementById('skipBody').style.display = 'none';

    // Reset all cards
    document.querySelectorAll('.video-option-card').forEach(card => {
        card.classList.remove('active');
    });

    // Reset all buttons
    document.getElementById('ytBtn').textContent = 'Select';
    document.getElementById('waBtn').textContent = 'Select';
    document.getElementById('skipBtn').textContent = 'Select';

    // Activate selected
    if (option === 'youtube') {
        document.getElementById('optionYoutube').classList.add('active');
        document.getElementById('youtubeBody').style.display = 'block';
        document.getElementById('ytBtn').textContent = '✅ Selected';
    } else if (option === 'whatsapp') {
        document.getElementById('optionWhatsapp').classList.add('active');
        document.getElementById('whatsappBody').style.display = 'block';
        document.getElementById('waBtn').textContent = '✅ Selected';
    } else if (option === 'skip') {
        document.getElementById('optionSkip').classList.add('active');
        document.getElementById('skipBody').style.display = 'block';
        document.getElementById('skipBtn').textContent = '✅ Selected';
    }
}

// Video link preview — YouTube aur Google Drive dono support karta hai
function extractDriveFileId(url) {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}

document.addEventListener('DOMContentLoaded', function () {
    const ytInput = document.getElementById('youtubeLink');
    if (ytInput) {
        ytInput.addEventListener('input', function () {
            const url = this.value;
            const videoId = extractYouTubeId(url);
            const preview = document.getElementById('videoPreview');
            const frame = document.getElementById('previewFrame');

            if (videoId) {
                frame.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
                preview.style.display = 'block';
            } else {
                const driveFileId = extractDriveFileId(url);
                if (driveFileId) {
                    frame.src = `https://drive.google.com/file/d/${driveFileId}/preview`;
                    preview.style.display = 'block';
                } else {
                    preview.style.display = 'none';
                }
            }
        });
    }
});

function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// ===== DOCUMENT OPTION =====
function showDocOption(option) {
    document.getElementById('driveOption').style.display = 'none';
    document.getElementById('whatsappDocOption').style.display = 'none';

    if (option === 'drive') {
        document.getElementById('driveOption').style.display = 'block';
    } else if (option === 'whatsapp') {
        document.getElementById('whatsappDocOption').style.display = 'block';
    }
}

// ===== FILL SUMMARY =====
function fillSummary() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const category = document.querySelector('input[name="category"]:checked');
    const amount = document.querySelector('input[name="amountRange"]:checked');

    document.getElementById('summaryContent').innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Naam</div>
            <div class="summary-value">${name}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Phone</div>
            <div class="summary-value">+91-${phone}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Location</div>
            <div class="summary-value">${city}, ${state}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Zarurat</div>
            <div class="summary-value">${category ? category.value : 'N/A'}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Amount</div>
            <div class="summary-value">₹${amount ? (amount.value === 'other' ? (document.getElementById('customAmount')?.value || 'N/A') : amount.value) : 'N/A'} tak</div>
        </div>
    `;
}

// ===== FORM SUBMIT =====

document.getElementById('needyForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateStep(4)) return;

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;

    // Show loading
    document.getElementById('loadingOverlay').style.display = 'flex';

    // Collect all data
    // NOTE: field names yahan functions/index.js ke registerNeedy() se match karte hain:
    //   - zaruratVideoLink (NOT youtubeLink)
    //   - documentUrl (NOT documentLink)
    //   - noOtherHelp (NOT otherHelpSought) — calculateUrgency() isi naam se check karta hai
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
		email: document.getElementById('email')?.value.trim() || '',
        age: document.getElementById('age').value || '',
        gender: document.querySelector('input[name="gender"]:checked')?.value || '',
        pincode: document.getElementById('pincode').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value,
        hasChildren: document.querySelector('input[name="hasChildren"]:checked')?.value || 'no',
        category: document.querySelector('input[name="category"]:checked')?.value || '',
        story: document.getElementById('story').value.trim(),
        amountNeeded: document.querySelector('input[name="amountRange"]:checked')?.value || '',
        customAmount: document.getElementById('customAmount')?.value || '',
        urgency: document.getElementById('urgency').value,
        // noOtherHelp = 'yes' jab user ne "Nahi, pehli baar" select kiya (otherHelpSought === 'no')
        // matlab "no other help sought" = true → calculateUrgency mein +7 score milega
        noOtherHelp: (document.querySelector('input[name="otherHelpSought"]:checked')?.value || 'no') === 'no' ? 'yes' : 'no',
        zaruratVideoLink: document.getElementById('youtubeLink')?.value || '',
        documentUrl: document.getElementById('documentLink')?.value || '',
        videoConsent: document.getElementById('videoConsent')?.checked || false,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
			headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        // Hide loading
        document.getElementById('loadingOverlay').style.display = 'none';

        if (result.success) {
            // Show success
            document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
            document.getElementById('stepSuccess').classList.add('active');
            document.getElementById('displayCaseId').textContent = result.id;

            // Store for sharing
            window.myCaseId = result.id;
            window.myName = formData.name;
            window.myCity = formData.city;
            window.myCategory = formData.category;

            // Update progress
            document.getElementById('progressFill').style.width = '100%';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(result.error || 'Kuch error hua. Please dobara try karein.');
            submitBtn.disabled = false;
        }

    } catch (error) {
        document.getElementById('loadingOverlay').style.display = 'none';
        submitBtn.disabled = false;
        // Fallback: WhatsApp se submit
        const waText = `🙏 Seva Connect Registration\n\nNaam: ${formData.name}\nPhone: ${formData.phone}\nCity: ${formData.city}\nCategory: ${formData.category}\nAmount: ${formData.amountNeeded}\n\nStory: ${formData.story}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`);
        alert('Internet issue! WhatsApp pe redirect kar rahe hain.');
    }
});

// ===== COPY CASE ID =====
function copyCaseId() {
    const caseId = document.getElementById('displayCaseId').textContent;
    navigator.clipboard.writeText(caseId).then(() => {
        alert('Case ID copy ho gaya! 📋');
    });
}

// ===== SHARE MY CASE =====
function shareMyCase() {
    const caseId = window.myCaseId || '';
    const name = window.myName?.split(' ')[0] || 'Ek zarooratmand';
    const city = window.myCity || '';
    const category = window.myCategory || '';

    const text = `🙏 Mujhe help chahiye!\n\nMain ${name} hun, ${city} se.\nMujhe ${category} mein help chahiye.\n\nMera case Seva Connect pe verify ho raha hai:\nsevaconnect.in\n\nAgar aap help kar sakte hain ya kisi ko jaante hain jo kar sake, please share karein! 🤲\n\nCase ID: ${caseId}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
}