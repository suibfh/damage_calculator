document.addEventListener('DOMContentLoaded', () => {
    const allInputFields = Array.from(document.querySelectorAll('[data-field]'));
    const initialFormState = {};
    allInputFields.forEach(input => {
        initialFormState[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
    });

    // ボタン要素を配列で取得
    const calculateBtns = [
        document.getElementById('calculateBtn'),
        document.getElementById('calculateBtn2')
    ];
    const manageProfileBtns = [
        document.getElementById('manageProfilesBtn'),
        document.getElementById('manageProfilesBtn2')
    ];
    const resetFormBtns = [
        document.getElementById('resetFormBtn'),
        document.getElementById('resetFormBtn2')
    ];

    // モーダル関連要素
    const profileModal = document.getElementById('profileModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const loadProfileBtn = document.getElementById('loadProfileBtn');
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');
    const profileNameInput = document.getElementById('profileNameInput');
    const profileListSelect = document.getElementById('profileList');

    const resultElements = {
        fieldname37: document.getElementById('result_fieldname37'),
        fieldname38: document.getElementById('result_fieldname38'),
        fieldname1: document.getElementById('result_fieldname1'),
        fieldname30: document.getElementById('result_fieldname30'),
        fieldname42: document.getElementById('result_fieldname42'),
    };

    const LS_PROFILES_KEY = 'bfhDamageCalcProfiles';

    // ProfileManager定義
    const ProfileManager = {
        loadProfiles: () => JSON.parse(localStorage.getItem(LS_PROFILES_KEY) || '{}'),
        saveProfile: (name, data) => {
            if (!name) return alert('プロフィール名を入力してください。'), false;
            const profiles = ProfileManager.loadProfiles();
            profiles[name] = data;
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            alert(`プロフィール「${name}」を保存しました。`);
            return true;
        },
        deleteProfile: (name) => {
            if (!name) return alert('削除するプロフィールを選択してください。'), false;
            if (!confirm(`プロフィール「${name}」を削除してもよろしいですか？`)) return false;
            const profiles = ProfileManager.loadProfiles();
            delete profiles[name];
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            alert(`プロフィール「${name}」を削除しました。`);
            return true;
        },
        getProfile: (name) => ProfileManager.loadProfiles()[name]
    };

    // UIManager定義
    const UIManager = {
        populateProfileList: () => {
            const profiles = ProfileManager.loadProfiles();
            profileListSelect.innerHTML = '<option value="">--- プロフィールを選択 ---</option>';
            Object.keys(profiles).forEach(name => {
                const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
                profileListSelect.appendChild(opt);
            });
        },
        openProfileModal: () => { profileModal.style.display = 'block'; profileNameInput.value = ''; UIManager.populateProfileList(); },
        closeProfileModal: () => profileModal.style.display = 'none',
        getFormData: () => allInputFields.reduce((obj, input) => (obj[input.dataset.field] = (input.value === '' ? 0 : (input.type==='number'? parseFloat(input.value):input.value)), obj), {}),
        setFormData: (data) => allInputFields.forEach(input => { if (data[input.dataset.field]!==undefined) input.value = data[input.dataset.field]; }),
        displayResults: (res) => Object.entries(res).forEach(([k,v]) => resultElements[k] && (resultElements[k].textContent = typeof v==='number' && !Number.isInteger(v) ? v.toFixed(2) : v)),
        resetForm: () => { if (confirm('フォームの入力内容を初期状態にリセットしますか？')) { UIManager.setFormData(initialFormState); Calculator.calculateAndDisplay(); }}
    };

    // Calculator定義
    const Calculator = {
        calculateAttackDamage: data => { const [f2,f4,f6,f8,f10,f12,f14] = [data.fieldname2||0,data.fieldname4||0,(data.fieldname6||0)/100,(data.fieldname8||0)/100,(data.fieldname10||0)/100,(data.fieldname12||0)/100,(data.fieldname14||100)/100]; const term1=f2*(1+f6-f10); const term2=(f4/2)*(1+f8-f12); return Math.floor(Math.max(Math.floor(term1-term2)*f14,0)); },
        calculateMagicDamage: data => { const [f3,f5,f7,f9,f11,f13,f15] = [data.fieldname3||0,data.fieldname5||0,(data.fieldname7||0)/100,(data.fieldname9||0)/100,(data.fieldname11||0)/100,(data.fieldname13||0)/100,(data.fieldname15||100)/100]; const term1=f3*(1+f7-f11); const term2=(f5/2)*(1+f9-f13); return Math.floor(Math.max(Math.floor(term1-term2)*f15,0)); },
        calculateTotalDamage: (data,atk,mag) => { const [f16,f17,f18,f19,f20,f22,f50] = [(data.fieldname16||0)/100,(data.fieldname17||0)/100,(data.fieldname18||0)/100,(data.fieldname19||0)/100,data.fieldname20||0,parseFloat(data.fieldname22)||1,(data.fieldname50||0)/100]; let m=(atk+mag)*(f22+f18-f17); m*=1-f16; m*=1+f19-f50; const base=Math.floor(m); return Math.floor(base*(100+f20)/100); },
        calculateHpThreshold: (total,data) => { const f29=data.fieldname29||30; return f29===100?Infinity:Math.round(total/(100-f29)*100); },
        calculateDamagePercentage: (total,data) => data.fieldname41? (total/data.fieldname41)*100 : 0,
        calculateAll: () => { const d=UIManager.getFormData(); const atk=Calculator.calculateAttackDamage(d); const mag=Calculator.calculateMagicDamage(d); const tot=Calculator.calculateTotalDamage(d,atk,mag); return {fieldname37:atk,fieldname38:mag,fieldname1:tot,fieldname30:Calculator.calculateHpThreshold(tot,d),fieldname42:Calculator.calculateDamagePercentage(tot,d)}; },
        calculateAndDisplay: () => UIManager.displayResults(Calculator.calculateAll())
    };

    // イベントリスナー登録
    calculateBtns.forEach(b=>b.addEventListener('click',Calculator.calculateAndDisplay));
    resetFormBtns.forEach(b=>b.addEventListener('click',UIManager.resetForm));
    manageProfileBtns.forEach(b=>b.addEventListener('click',UIManager.openProfileModal));
    closeModalBtn.addEventListener('click',UIManager.closeProfileModal);
    window.addEventListener('click',e=>{ if(e.target===profileModal) UIManager.closeProfileModal(); });
    saveProfileBtn.addEventListener('click',()=>{ if (ProfileManager.saveProfile(profileNameInput.value.trim(),UIManager.getFormData())) UIManager.populateProfileList(); });
    loadProfileBtn.addEventListener('click',()=>{ const n=profileListSelect.value; if(n){ const p=ProfileManager.getProfile(n); if(p){ UIManager.setFormData(p); Calculator.calculateAndDisplay(); UIManager.closeProfileModal(); } else alert('読み込み失敗'); } else alert('プロフィール選択'); });
    deleteProfileBtn.addEventListener('click',()=>{ const n=profileListSelect.value; if(n && ProfileManager.deleteProfile(n)) UIManager.populateProfileList(); else if(!n) alert('プロフィール選択'); });

    // 初期化
    UIManager.populateProfileList();
    Calculator.calculateAndDisplay();
});
