document.addEventListener('DOMContentLoaded', () => {
    const allInputFields = Array.from(document.querySelectorAll('[data-field]'));
    const initialFormState = {};
    allInputFields.forEach(input => {
        initialFormState[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
    });


    // --- DOM Elements ---
    const calculateBtn = document.getElementById('calculateBtn');
    const manageProfilesBtn = document.getElementById('manageProfilesBtn');
    const resetFormBtn = document.getElementById('resetFormBtn');

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

    // --- Utility Functions ---
    const getNumericValue = (id, defaultValue = 0) => {
        const val = parseFloat(document.getElementById(id).value);
        return isNaN(val) ? defaultValue : val;
    };

    const getSelectValue = (id, defaultValue = 1) => {
        const val = parseFloat(document.getElementById(id).value);
        return isNaN(val) ? defaultValue : val;
    };


    // --- Profile Management ---
    const ProfileManager = {
        loadProfiles: () => {
            const profiles = localStorage.getItem(LS_PROFILES_KEY);
            return profiles ? JSON.parse(profiles) : {};
        },
        saveProfile: (name, data) => {
            if (!name) {
                alert('プロフィール名を入力してください。');
                return false;
            }
            const profiles = ProfileManager.loadProfiles();
            profiles[name] = data;
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            alert(`プロフィール「${name}」を保存しました。`);
            return true;
        },
        deleteProfile: (name) => {
            if (!name) {
                alert('削除するプロフィールを選択してください。');
                return false;
            }
            if (!confirm(`プロフィール「${name}」を削除してもよろしいですか？`)) return false;

            const profiles = ProfileManager.loadProfiles();
            delete profiles[name];
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            alert(`プロフィール「${name}」を削除しました。`);
            return true;
        },
        getProfile: (name) => {
            const profiles = ProfileManager.loadProfiles();
            return profiles[name];
        }
    };

    // --- UI Management ---
    const UIManager = {
        openProfileModal: () => {
            profileModal.style.display = 'block';
            UIManager.populateProfileList();
            profileNameInput.value = ''; // Clear name input on open
        },
        closeProfileModal: () => {
            profileModal.style.display = 'none';
        },
        populateProfileList: () => {
            const profiles = ProfileManager.loadProfiles();
            profileListSelect.innerHTML = '<option value="">--- プロフィールを選択 ---</option>';
            for (const name in profiles) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                profileListSelect.appendChild(option);
            }
        },
        getFormData: () => {
            const data = {};
            allInputFields.forEach(input => {
                data[input.dataset.field] = input.type === 'number' ? (input.value === '' ? 0 : parseFloat(input.value)) : input.value;
            });
            return data;
        },
        setFormData: (data) => {
            allInputFields.forEach(input => {
                if (data.hasOwnProperty(input.dataset.field)) {
                     input.value = data[input.dataset.field];
                }
            });
        },
        displayResults: (results) => {
            for (const key in results) {
                if (resultElements[key]) {
                    // 小数点以下が多い場合は丸める（例: 2桁まで）
                    const value = results[key];
                    if (typeof value === 'number' && !Number.isInteger(value)) {
                         resultElements[key].textContent = value.toFixed(2);
                    } else {
                         resultElements[key].textContent = value;
                    }
                }
            }
        },
        resetForm: () => {
            if (confirm('フォームの入力内容を初期状態にリセットしますか？（保存されたプロフィールには影響しません）')) {
                UIManager.setFormData(initialFormState);
                Calculator.calculateAndDisplay(); // リセット後も再計算して結果を0にする
            }
        }
    };

    // --- Calculation Engine ---
    const Calculator = {
        // fieldname37: 攻撃ダメージ
        calculateAttackDamage: (data) => {
            const f2 = data.fieldname2 || 0;
            const f4 = data.fieldname4 || 0;
            const f6 = (data.fieldname6 || 0) / 100;
            const f8 = (data.fieldname8 || 0) / 100;
            const f10 = (data.fieldname10 || 0) / 100;
            const f12 = (data.fieldname12 || 0) / 100;
            const f14 = (data.fieldname14 || 100) / 100;

            const term1 = f2 * (1 + f6 - f10);
            const term2 = (f4 / 2) * (1 + f8 - f12);
            const baseDamage = Math.floor(term1 - term2);
            return Math.floor(Math.max(baseDamage * f14, 0));
        },

        // fieldname38: 魔攻ダメージ
        calculateMagicDamage: (data) => {
            const f3 = data.fieldname3 || 0;
            const f5 = data.fieldname5 || 0;
            const f7 = (data.fieldname7 || 0) / 100;
            const f9 = (data.fieldname9 || 0) / 100;
            const f11 = (data.fieldname11 || 0) / 100;
            const f13 = (data.fieldname13 || 0) / 100;
            const f15 = (data.fieldname15 || 100) / 100;

            const term1 = f3 * (1 + f7 - f11);
            const term2 = (f5 / 2) * (1 + f9 - f13);
            const baseDamage = Math.floor(term1 - term2);
            return Math.floor(Math.max(baseDamage * f15, 0));
        },

        // fieldname1: 総合ダメージ
        calculateTotalDamage: (data, atkDmg, magDmg) => {
            const f16 = (data.fieldname16 || 0) / 100; // 属性軽減 (スキル・BB) %
            const f17 = (data.fieldname17 || 0) / 100; // 弱ダメ軽減 %
            const f18 = (data.fieldname18 || 0) / 100; // 弱ダメアップ %
            const f19 = (data.fieldname19 || 0) / 100; // 被状態異常ダメアップ %
            const f20_raw = data.fieldname20 || 0;      // BBダメアップ % (raw value)
            const f22 = parseFloat(data.fieldname22) || 1;    // 属性相性
            const f50 = (data.fieldname50 || 0) / 100; // 属性軽減 (特性) %

            const sumOfDamages = atkDmg + magDmg;

            let modifiedDamage = sumOfDamages * (f22 + f18 - f17);
            modifiedDamage = modifiedDamage * (1 - f16);
            modifiedDamage = modifiedDamage * (1 + f19 - f50);

            const flooredModifiedDamage = Math.floor(modifiedDamage);
            const finalTotalDamage = flooredModifiedDamage * (100 + f20_raw) / 100;

            // 総合ダメージは最終的に整数にするのが一般的だと思われるため、floorを適用
            // もし元の計算式の挙動が小数点以下を保持するなら下の行をコメントアウト/修正
            return Math.floor(finalTotalDamage);
        },

        // fieldname30: HP上限目安
        calculateHpThreshold: (totalDamage, data) => {
            const f29 = data.fieldname29 || 30; // 全体BB発動HP %
            if (100 - f29 === 0) return Infinity;
            const threshold = totalDamage / (100 - f29) * 100;
            return Math.round(threshold);
        },

        // fieldname42: ダメージ割合(%)
        calculateDamagePercentage: (totalDamage, data) => {
            const f41 = data.fieldname41 || 0; // 最大HP
            if (f41 === 0) return 0;
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

    // --- Event Listeners ---
    calculateBtn.addEventListener('click', Calculator.calculateAndDisplay);
    resetFormBtn.addEventListener('click', UIManager.resetForm);

    manageProfilesBtn.addEventListener('click', UIManager.openProfileModal);
    closeModalBtn.addEventListener('click', UIManager.closeProfileModal);
    window.addEventListener('click', (event) => { // Close modal if clicked outside
        if (event.target == profileModal) {
            UIManager.closeProfileModal();
        }
    });

    saveProfileBtn.addEventListener('click', () => {
        const name = profileNameInput.value.trim();
        const data = UIManager.getFormData();
        if (ProfileManager.saveProfile(name, data)) {
            UIManager.populateProfileList(); // Refresh list
            profileNameInput.value = ''; // Clear name input
        }
    });

    loadProfileBtn.addEventListener('click', () => {
        const name = profileListSelect.value;
        if (name) {
            const profileData = ProfileManager.getProfile(name);
            if (profileData) {
                UIManager.setFormData(profileData);
                Calculator.calculateAndDisplay(); // Recalculate with loaded data
                UIManager.closeProfileModal();
            } else {
                alert("選択されたプロフィールの読み込みに失敗しました。");
            }
        } else {
            alert('読み込むプロフィールを選択してください。');
        }
    });

    deleteProfileBtn.addEventListener('click', () => {
        const name = profileListSelect.value;
        if (name) {
            if (ProfileManager.deleteProfile(name)) {
                UIManager.populateProfileList(); // Refresh list
            }
        } else {
            alert('削除するプロフィールを選択してください。');
        }
    });

    // Add event listeners to all input fields to recalculate on change
    allInputFields.forEach(input => {
        input.addEventListener('input', () => {
            // オプション：入力変更時に即時計算する場合は以下のコメントを解除
            // Calculator.calculateAndDisplay();
        });
    });


    // --- Initial Setup ---
    UIManager.populateProfileList(); // Populate profile list on load
    Calculator.calculateAndDisplay(); // Initial calculation with default values
});
