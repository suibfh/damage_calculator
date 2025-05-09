document.addEventListener('DOMContentLoaded', () => {
    const LS_PROFILES_KEY = 'bfhDamageCalcProfiles_v2';
    const LS_AUTO_SAVE_KEY = 'bfhDamageCalcFormState_v2';
    let initialFormState = {};

    const UIManager = {
        allInputFields: [],
        resultElements: {},

        init() {
            this.allInputFields = Array.from(document.querySelectorAll('[data-field]'));
            this.resultElements = {
                fieldname37: document.getElementById('result_fieldname37'),
                fieldname38: document.getElementById('result_fieldname38'),
                fieldname1: document.getElementById('result_fieldname1'),
                fieldname30: document.getElementById('result_fieldname30'),
                fieldname42: document.getElementById('result_fieldname42'),
            };

            this.captureInitialFormState();
            this.loadFormState(); // Load auto-saved state first
            this.setupEventListeners();
            this.updateAllRadioGroupVisuals();
            this.updateAllBuffButtonVisuals();
            Calculator.calculateAndDisplay(); // Initial calculation
        },

        captureInitialFormState() {
            initialFormState = {};
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (input.type === 'hidden' && input.closest('.radio-button-group')) {
                    // For radio groups, find the initially active button if any, or use hidden input's value
                    const group = input.closest('.radio-button-group');
                    const activeButton = group.querySelector('.btn-radio.active');
                    initialFormState[fieldName] = activeButton ? activeButton.dataset.value : input.value;
                } else {
                    initialFormState[fieldName] = input.value;
                }
            });
        },
        
        setupEventListeners() {
            document.getElementById('calculateBtn').addEventListener('click', () => Calculator.calculateAndDisplay());
            document.getElementById('resetFormBtn').addEventListener('click', () => this.resetForm());
            document.getElementById('manageProfilesBtn').addEventListener('click', () => this.openProfileModal());
            document.getElementById('closeModalBtn').addEventListener('click', () => this.closeProfileModal());
            document.getElementById('saveProfileBtn').addEventListener('click', () => ProfileManager.handleSaveProfile());
            document.getElementById('loadProfileBtn').addEventListener('click', () => ProfileManager.handleLoadProfile());
            document.getElementById('deleteProfileBtn').addEventListener('click', () => ProfileManager.handleDeleteProfile());
            
            document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
            document.getElementById('importDataInput').addEventListener('change', (e) => this.importData(e));

            window.addEventListener('click', (event) => {
                if (event.target === document.getElementById('profileModal')) {
                    this.closeProfileModal();
                }
            });

            // Plus-Minus buttons
            document.querySelectorAll('.pm-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetId = e.target.dataset.target;
                    const step = parseInt(e.target.dataset.step, 10);
                    this.handleNumberButtonClick(targetId, step);
                });
            });

            // Radio-button groups
            document.querySelectorAll('.radio-button-group .btn-radio').forEach(button => {
                button.addEventListener('click', (e) => {
                    const group = e.target.closest('.radio-button-group');
                    const targetField = group.dataset.radioGroupField;
                    const value = e.target.dataset.value;
                    this.handleRadioSelection(targetField, value, group);
                });
            });
            
            // Buff buttons
            document.querySelectorAll('.buff-buttons .buff-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetId = e.target.dataset.target;
                    const value = e.target.dataset.value;
                    this.handleBuffSelection(targetId, value);
                });
            });

            // Auto-save on input change
            this.allInputFields.forEach(input => {
                input.addEventListener('change', () => this.saveCurrentFormState()); // 'change' is better than 'input' for perf
                input.addEventListener('input', () => { // For number fields that might not fire 'change' on +/-
                    if (input.type === 'number') this.saveCurrentFormStateDebounced();
                });
            });
        },

        handleNumberButtonClick(fieldId, step) {
            const inputElement = document.getElementById(fieldId);
            if (inputElement) {
                let currentValue = parseFloat(inputElement.value) || 0;
                inputElement.value = currentValue + step;
                this.saveCurrentFormState();
                 this.updateBuffButtonVisuals(fieldId); // Update buff buttons if they control this field
            }
        },
        
        handleRadioSelection(fieldId, value, groupElement) {
            const hiddenInput = document.getElementById(fieldId);
            if (hiddenInput) {
                hiddenInput.value = value;
                // Update visual state of buttons in the group
                groupElement.querySelectorAll('.btn-radio').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === value);
                });
                this.saveCurrentFormState();
            }
        },

        handleBuffSelection(fieldId, value) {
            const inputElement = document.getElementById(fieldId);
            if (inputElement) {
                inputElement.value = value;
                this.updateBuffButtonVisuals(fieldId);
                this.saveCurrentFormState();
            }
        },
        
        updateRadioGroupVisuals(fieldId) {
            const hiddenInput = document.getElementById(fieldId);
            if (hiddenInput && hiddenInput.closest('.radio-button-group')) {
                 const group = hiddenInput.closest('.radio-button-group');
                 const currentValue = hiddenInput.value;
                 group.querySelectorAll('.btn-radio').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === currentValue);
                });
            } else { // New structure with data-radio-group-field
                const group = document.querySelector(`.radio-button-group[data-radio-group-field="${fieldId}"]`);
                if (group) {
                    const hiddenActualInput = document.getElementById(fieldId); // This is the hidden input
                    if (hiddenActualInput) {
                        const currentValue = hiddenActualInput.value;
                         group.querySelectorAll('.btn-radio').forEach(btn => {
                            btn.classList.toggle('active', btn.dataset.value === currentValue);
                        });
                    }
                }
            }
        },

        updateAllRadioGroupVisuals() {
            document.querySelectorAll('.radio-button-group[data-radio-group-field]').forEach(group => {
                this.updateRadioGroupVisuals(group.dataset.radioGroupField);
            });
        },

        updateBuffButtonVisuals(fieldId) {
            const inputElement = document.getElementById(fieldId);
            const buffButtonGroup = inputElement.closest('.form-group').querySelector('.buff-buttons');
            if (inputElement && buffButtonGroup) {
                const currentValue = inputElement.value;
                buffButtonGroup.querySelectorAll('.buff-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === currentValue);
                });
            }
        },
        
        updateAllBuffButtonVisuals() {
            this.allInputFields.forEach(input => {
                this.updateBuffButtonVisuals(input.id);
            });
        },

        getFormData() {
            const data = {};
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                data[fieldName] = (input.type === 'number' && input.value === '') ? '0' : input.value; // Store as string for consistency with localStorage
            });
            return data;
        },

        setFormData(data) {
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (data.hasOwnProperty(fieldName)) {
                    input.value = data[fieldName];
                    // If it's part of a radio group or buff group, update visuals
                    this.updateRadioGroupVisuals(fieldName);
                    this.updateBuffButtonVisuals(fieldName);
                }
            });
            this.saveCurrentFormState(); // Save after setting, e.g. after import or profile load
        },

        displayResults(results) {
            for (const key in results) {
                if (this.resultElements[key]) {
                    const value = results[key];
                    let displayValue;
                    if (typeof value === 'number') {
                        if (Number.isInteger(value)) {
                            displayValue = value;
                        } else if (key === 'fieldname42') { // Damage percentage
                            displayValue = value.toFixed(2);
                        } 
                        else {
                             displayValue = Math.floor(value); // Default to floor for most damage numbers
                        }
                    } else {
                         displayValue = value;
                    }
                     this.resultElements[key].textContent = displayValue;
                }
            }
        },

        resetForm() {
            if (confirm('フォームの入力内容を初期状態にリセットしますか？（保存されたプロフィールや自動保存内容には影響しません）')) {
                this.setFormData(initialFormState);
                Calculator.calculateAndDisplay();
                // Explicitly clear auto-save as well if desired, or leave it to be overwritten on next input
                // localStorage.removeItem(LS_AUTO_SAVE_KEY); 
            }
        },

        openProfileModal() {
            document.getElementById('profileModal').style.display = 'block';
            ProfileManager.populateProfileList();
            document.getElementById('profileNameInput').value = '';
        },

        closeProfileModal() {
            document.getElementById('profileModal').style.display = 'none';
        },

        saveCurrentFormState() {
            // console.log("Saving form state to localStorage");
            const formData = this.getFormData();
            localStorage.setItem(LS_AUTO_SAVE_KEY, JSON.stringify(formData));
        },
        
        // Debounced save function
        _saveTimeout: null,
        saveCurrentFormStateDebounced() {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = setTimeout(() => {
                this.saveCurrentFormState();
            }, 500); // Adjust debounce delay as needed (e.g., 500ms)
        },

        loadFormState() {
            const savedState = localStorage.getItem(LS_AUTO_SAVE_KEY);
            if (savedState) {
                // console.log("Loading form state from localStorage");
                try {
                    const formData = JSON.parse(savedState);
                    this.setFormData(formData);
                } catch (e) {
                    console.error("Error parsing auto-saved state from localStorage:", e);
                    localStorage.removeItem(LS_AUTO_SAVE_KEY); // Clear corrupted data
                }
            } else {
                // If no auto-saved state, ensure form is set to initial (already done by captureInitialFormState if no load)
                 this.setFormData(initialFormState); // Ensure initial state is applied and visuals updated
            }
        },

        exportData() {
            const data = localStorage.getItem(LS_AUTO_SAVE_KEY);
            if (!data) {
                alert('エクスポートするデータがありません。');
                return;
            }
            const filename = `bfh_calc_data_${new Date().toISOString().slice(0,10)}.json`;
            const blob = new Blob([data], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('現在の入力内容をエクスポートしました。');
        },

        importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = e.target.result;
                    JSON.parse(jsonData); // Validate JSON
                    localStorage.setItem(LS_AUTO_SAVE_KEY, jsonData);
                    this.loadFormState(); // Reloads and sets form data
                    Calculator.calculateAndDisplay();
                    alert('データをインポートし、フォームに適用しました。');
                } catch (err) {
                    alert('無効なファイル形式です。JSONファイルを選択してください。');
                    console.error("Import error:", err);
                } finally {
                    event.target.value = null; // Reset file input
                }
            };
            reader.readAsText(file);
        }
    };

    const ProfileManager = {
        profileNameInput: document.getElementById('profileNameInput'),
        profileListSelect: document.getElementById('profileList'),

        loadProfiles: () => {
            const profiles = localStorage.getItem(LS_PROFILES_KEY);
            return profiles ? JSON.parse(profiles) : {};
        },
        saveToProfiles: (name, data) => {
            if (!name) {
                alert('プロフィール名を入力してください。');
                return false;
            }
            const profiles = ProfileManager.loadProfiles();
            profiles[name] = data;
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            return true;
        },
        deleteFromProfiles: (name) => {
            if (!name) return false;
            const profiles = ProfileManager.loadProfiles();
            delete profiles[name];
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            return true;
        },
        getFromProfiles: (name) => {
            const profiles = ProfileManager.loadProfiles();
            return profiles[name];
        },
        populateProfileList: () => {
            const profiles = ProfileManager.loadProfiles();
            ProfileManager.profileListSelect.innerHTML = '<option value="">--- プロフィールを選択 ---</option>';
            for (const name in profiles) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                ProfileManager.profileListSelect.appendChild(option);
            }
        },
        handleSaveProfile: () => {
            const name = ProfileManager.profileNameInput.value.trim();
            const currentFormData = UIManager.getFormData(); // Use current form state, not auto-saved
            if (ProfileManager.saveToProfiles(name, currentFormData)) {
                alert(`プロフィール「${name}」を保存しました。`);
                ProfileManager.populateProfileList();
                ProfileManager.profileNameInput.value = '';
            }
        },
        handleLoadProfile: () => {
            const name = ProfileManager.profileListSelect.value;
            if (name) {
                const profileData = ProfileManager.getFromProfiles(name);
                if (profileData) {
                    UIManager.setFormData(profileData);
                    Calculator.calculateAndDisplay();
                    UIManager.closeProfileModal();
                    alert(`プロフィール「${name}」を読み込みました。`);
                } else {
                    alert("選択されたプロフィールの読み込みに失敗しました。");
                }
            } else {
                alert('読み込むプロフィールを選択してください。');
            }
        },
        handleDeleteProfile: () => {
            const name = ProfileManager.profileListSelect.value;
            if (name) {
                if (confirm(`プロフィール「${name}」を削除してもよろしいですか？`)) {
                    if (ProfileManager.deleteFromProfiles(name)) {
                        alert(`プロフィール「${name}」を削除しました。`);
                        ProfileManager.populateProfileList();
                    }
                }
            } else {
                alert('削除するプロフィールを選択してください。');
            }
        }
    };

    const Calculator = {
        getNumericValue(data, fieldName, defaultValue = 0) {
            const valStr = data[fieldName];
            if (valStr === undefined || valStr === null || valStr.trim() === '') return defaultValue;
            const val = parseFloat(valStr);
            return isNaN(val) ? defaultValue : val;
        },

        calculateAttackDamage: (data) => {
            const f2 = Calculator.getNumericValue(data, 'fieldname2');    // 攻撃 (基礎ステ)
            const f4 = Calculator.getNumericValue(data, 'fieldname4');    // 防御 (基礎ステ)
            const f6 = Calculator.getNumericValue(data, 'fieldname6') / 100;  // 攻撃バフ (%)
            const f8 = Calculator.getNumericValue(data, 'fieldname8') / 100;  // 防御アップ (%)
            const f10 = Calculator.getNumericValue(data, 'fieldname10') / 100; // 攻撃ダウン (%)
            const f12 = Calculator.getNumericValue(data, 'fieldname12') / 100; // 防御ダウン (%)
            const f14 = Calculator.getNumericValue(data, 'fieldname14', 100) / 100; // 攻撃倍率 (%)
    
            const term1 = f2 * (1 + f6 - f10);
            const term2 = (f4 / 2) * (1 + f8 - f12);
            const baseDamage = Math.floor(term1 - term2);
            return Math.max(baseDamage * f14, 0); // 元の計算式がfloorしていなかったので合わせる、最終的にfloorは総合ダメージで
        },
    
        calculateMagicDamage: (data) => {
            const f3 = Calculator.getNumericValue(data, 'fieldname3');    // 魔攻 (基礎ステ)
            const f5 = Calculator.getNumericValue(data, 'fieldname5');    // 魔防 (基礎ステ)
            const f7 = Calculator.getNumericValue(data, 'fieldname7') / 100;  // 魔攻バフ (%)
            const f9 = Calculator.getNumericValue(data, 'fieldname9') / 100;  // 魔防アップ (%)
            const f11 = Calculator.getNumericValue(data, 'fieldname11') / 100; // 魔攻ダウン (%)
            const f13 = Calculator.getNumericValue(data, 'fieldname13') / 100; // 魔防ダウン (%)
            const f15 = Calculator.getNumericValue(data, 'fieldname15', 100) / 100; // 魔攻倍率 (%)
            
            const term1 = f3 * (1 + f7 - f11);
            const term2 = (f5 / 2) * (1 + f9 - f13);
            const baseDamage = Math.floor(term1 - term2);
            return Math.max(baseDamage * f15, 0); // 同上
        },
    
        calculateTotalDamage: (data, atkDmg, magDmg) => {
            const f16 = Calculator.getNumericValue(data, 'fieldname16') / 100; // 属性軽減 (スキル・BB) %
            const f17 = Calculator.getNumericValue(data, 'fieldname17') / 100; // 弱ダメ軽減 %
            const f18 = Calculator.getNumericValue(data, 'fieldname18') / 100; // 弱ダメアップ %
            const f19 = Calculator.getNumericValue(data, 'fieldname19') / 100; // 被状態異常ダメアップ %
            const f20_raw = Calculator.getNumericValue(data, 'fieldname20');     // BBダメアップ % (raw value)
            const f22 = Calculator.getNumericValue(data, 'fieldname22', 1);   // 属性相性
            const f50 = Calculator.getNumericValue(data, 'fieldname50') / 100; // 属性軽減 (特性) %
    
            const sumOfDamages = atkDmg + magDmg;
            
            let modifiedDamage = sumOfDamages * (f22 + f18 - f17);
            modifiedDamage = modifiedDamage * (1 - f16); // スキル属性軽減
            modifiedDamage = modifiedDamage * (1 - f50); // 特性属性軽減 (元はf19の減算側にあったが、意味合いからこちらが自然か。要確認)
                                                          // 元の式: modifiedDamage * (1 + f19 - f50);
                                                          // ここでは (1+f19) と (1-f50) を別々に乗算する形に変更 (より一般的)
            modifiedDamage = modifiedDamage * (1 + f19); // 被状態異常ダメアップ

            const flooredModifiedDamage = Math.floor(modifiedDamage); // ここで一度floor
            const finalTotalDamage = flooredModifiedDamage * (100 + f20_raw) / 100;
            
            return Math.floor(finalTotalDamage); 
        },

        calculateHpThreshold: (totalDamage, data) => {
            const f29 = Calculator.getNumericValue(data, 'fieldname29', 30); // 全体BB発動HP %
            if (f29 >= 100 || f29 < 0) return Infinity; // Avoid division by zero or negative
            if (totalDamage <= 0) return 0;
            const threshold = totalDamage / ((100 - f29) / 100); // (100-f29)が割合なので/100する
            return Math.round(threshold);
        },

        calculateDamagePercentage: (totalDamage, data) => {
            const f41 = Calculator.getNumericValue(data, 'fieldname41'); // 最大HP
            if (f41 === 0 || totalDamage <= 0) return 0;
            return (totalDamage / f41) * 100;
        },

        calculateAll: () => {
            const formData = UIManager.getFormData();
            const results = {};

            results.fieldname37 = Calculator.calculateAttackDamage(formData);
            results.fieldname38 = Calculator.calculateMagicDamage(formData);
            results.fieldname1 = Calculator.calculateTotalDamage(formData, results.fieldname37, results.fieldname38);
            results.fieldname30 = Calculator.calculateHpThreshold(results.fieldname1, formData);
            results.fieldname42 = Calculator.calculateDamagePercentage(results.fieldname1, formData);
            
            return results;
        },

        calculateAndDisplay: () => {
            const results = Calculator.calculateAll();
            UIManager.displayResults(results);
        }
    };

    // --- Initial Setup ---
    UIManager.init();

});