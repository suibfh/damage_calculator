document.addEventListener('DOMContentLoaded', () => {
    // Element Selectors
    const inputForm = document.getElementById('inputForm');
    const allInputFields = inputForm.querySelectorAll('input[data-field]'); // Selects all inputs (including hidden) with data-field within the form
    const radioButtons = inputForm.querySelectorAll('.btn-radio'); // Select all radio buttons within the form
    const pmButtons = inputForm.querySelectorAll('.pm-btn');
    const buffButtons = inputForm.querySelectorAll('.buff-btn');
    const actionButtons = document.querySelectorAll('.js-action-btn'); // These might be outside the form

    const formModal = document.getElementById('formModal');
    const formNameInput = document.getElementById('formNameInput');
    const saveFormBtn = document.getElementById('saveFormBtn');
    const formListSelect = document.getElementById('formList');
    const loadFormBtn = document.getElementById('loadFormBtn');
    const deleteFormBtn = document.getElementById('deleteFormBtn');

    class UIManager {
        static getFormData() {
            const data = {};
            allInputFields.forEach(input => {
                if (input.dataset.field) { // Ensure input has data-field attribute
                    if (input.type === 'number') {
                        data[input.dataset.field] = parseFloat(input.value) || 0;
                    } else if (input.type === 'hidden') { // Hidden inputs for radio buttons
                        // Value is already set by radio button click. parseFloat handles string values.
                        // Default values (e.g., for fieldname22 if NaN) are handled in the Calculator class.
                        data[input.dataset.field] = parseFloat(input.value);
                    } else { // Other types like text (currently not used for calculation fields)
                        data[input.dataset.field] = input.value;
                    }
                }
            });
            return data;
        }

        static setFormData(dataToLoad) {
            allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (fieldName && dataToLoad.hasOwnProperty(fieldName)) {
                    input.value = dataToLoad[fieldName];

                    // If it's a hidden input for a radio group, update active button
                    if (input.type === 'hidden') {
                        const radioGroup = inputForm.querySelector(`.radio-button-group[data-radio-group-field="${fieldName}"]`);
                        if (radioGroup) {
                            radioGroup.querySelectorAll('.btn-radio').forEach(radio => {
                                // Compare dataset.value (string) with the loaded data (might be number, convert to string for comparison)
                                radio.classList.toggle('active', radio.dataset.value === String(dataToLoad[fieldName]));
                            });
                        }
                    }
                }
            });
        }

        static setResult(fieldId, value) {
            const element = document.getElementById(`result_${fieldId}`);
            if (element) {
                element.textContent = value;
            }
        }

        static resetForm() {
            allInputFields.forEach(input => {
                const field = input.dataset.field;
                if (!field) return; // Skip if no data-field

                if (input.type === 'number') {
                    if (field === 'fieldname14' || field === 'fieldname15') { // 攻撃倍率, 魔攻倍率
                        input.value = '100';
                    } else if (field === 'fieldname29') { // 全体BB発動HP
                        input.value = '30';
                    } else if (field === 'fieldname41') { // 最大HP
                        input.value = ''; // Empty
                    } else {
                        input.value = '0';
                    }
                } else if (input.type === 'hidden') { // Radio button groups' hidden inputs
                    const defaultValue = field === 'fieldname22' ? '1' : '0'; // fieldname22 default 1, others 0
                    input.value = defaultValue;
                    // Update active state of corresponding radio buttons
                    const radioGroup = inputForm.querySelector(`.radio-button-group[data-radio-group-field="${field}"]`);
                    if (radioGroup) {
                        radioGroup.querySelectorAll('.btn-radio').forEach(radioBtn => {
                            radioBtn.classList.toggle('active', radioBtn.dataset.value === defaultValue);
                        });
                    }
                }
            });
            Calculator.calculateAndDisplay();
        }
        
        static openFormModal() {
            formModal.style.display = 'block';
            if (!document.querySelector('.modal-overlay')) {
                document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay"></div>');
                const overlay = document.querySelector('.modal-overlay');
                if(overlay) overlay.addEventListener('click', UIManager.closeFormModal);
            }
        }

        static closeFormModal() {
            formModal.style.display = 'none';
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) {
                overlay.remove();
            }
        }

        static populateFormList() {
            const forms = FormStorage.getAllForms();
            formListSelect.innerHTML = '<option value="">保存データを選択</option>'; // Initialize dropdown
            forms.forEach(form => {
                const option = document.createElement('option');
                option.value = form.name;
                option.textContent = form.name;
                formListSelect.appendChild(option);
            });
        }
    }

    class FormStorage {
        static STORAGE_KEY = 'bfhCalcForms_v20250514'; // Unique key for this version's storage

        static getAllForms() {
            const forms = localStorage.getItem(FormStorage.STORAGE_KEY);
            return forms ? JSON.parse(forms) : [];
        }

        static saveForm(name, data) {
            if (!name) {
                alert('フォーム名を入力してください。');
                return false;
            }
            const forms = FormStorage.getAllForms();
            const existingIndex = forms.findIndex(form => form.name === name);
            if (existingIndex > -1) {
                forms[existingIndex].data = data; // Update existing
            } else {
                forms.push({ name, data }); // Add new
            }
            localStorage.setItem(FormStorage.STORAGE_KEY, JSON.stringify(forms));
            return true;
        }

        static loadForm(name) {
            const forms = FormStorage.getAllForms();
            const formData = forms.find(form => form.name === name);
            return formData ? formData.data : null; // Return only the data part
        }

        static deleteForm(name) {
            let forms = FormStorage.getAllForms();
            forms = forms.filter(form => form.name !== name);
            localStorage.setItem(FormStorage.STORAGE_KEY, JSON.stringify(forms));
            UIManager.populateFormList(); // Refresh list after deletion
            // If the deleted form was selected, reset the select element
            if (formListSelect.value === name) {
                 formListSelect.value = "";
            }
            return true;
        }
    }

    class Calculator {
        static calculateAndDisplay() {
            const data = UIManager.getFormData();

            // Parse values, providing defaults if NaN or not present
            const fieldname2 = parseFloat(data.fieldname2) || 0;  // 攻撃(基礎ステ)
            const fieldname3 = parseFloat(data.fieldname3) || 0;  // 魔攻(基礎ステ)
            const fieldname6 = parseFloat(data.fieldname6) || 0;  // 攻撃バフ
            const fieldname7 = parseFloat(data.fieldname7) || 0;  // 魔攻バフ
            const fieldname10 = parseFloat(data.fieldname10) || 0; // 攻撃ダウン
            const fieldname11 = parseFloat(data.fieldname11) || 0; // 魔攻ダウン
            const fieldname4 = parseFloat(data.fieldname4) || 0;  // 防御
            const fieldname5 = parseFloat(data.fieldname5) || 0;  // 魔防
            const fieldname8 = parseFloat(data.fieldname8) || 0;  // 防御アップ
            const fieldname9 = parseFloat(data.fieldname9) || 0;  // 魔防アップ
            const fieldname12 = parseFloat(data.fieldname12) || 0; // 防御ダウン
            const fieldname13 = parseFloat(data.fieldname13) || 0; // 魔防ダウン
            const fieldname14 = parseFloat(data.fieldname14) || 0; // 攻撃倍率
            const fieldname15 = parseFloat(data.fieldname15) || 0; // 魔攻倍率

            const fieldname18 = parseFloat(data.fieldname18) || 0; // 弱ダメアップ
            const fieldname17 = parseFloat(data.fieldname17) || 0; // 弱ダメ軽減 (数値入力)
            const fieldname16 = parseFloat(data.fieldname16) || 0; // 属性軽減 (スキル・BB)
            const fieldname19 = parseFloat(data.fieldname19) || 0; // 被状態異常ダメアップ (ラジオボタン)
            const fieldname50 = parseFloat(data.fieldname50) || 0; // 属性軽減 (特性) (ラジオボタン)
            const fieldname22 = parseFloat(data.fieldname22) || 1;  // 属性相性 (ラジオボタン, default 1)
            const fieldname20 = parseFloat(data.fieldname20) || 0; // BBダメアップ
            const fieldname29_val = parseFloat(data.fieldname29) || 0; // 全体BB発動HP
            const maxHP = parseFloat(data.fieldname41) || 0;           // 最大HP

            // 攻撃ダメージ計算 (fieldname37)
            let baseAtkCalc = (fieldname2 * (1 + fieldname6/100 - fieldname10/100)) - (fieldname4/2 * (1 + fieldname8/100 - fieldname12/100));
            let physicalDamage = Math.floor(
                Math.max(
                    Math.floor(baseAtkCalc) * (fieldname14 / 100),
                    0
                )
            );
            if (isNaN(physicalDamage) || !isFinite(physicalDamage)) physicalDamage = 0;

            // 魔攻ダメージ計算 (fieldname38)
            let baseMagCalc = (fieldname3 * (1 + fieldname7/100 - fieldname11/100)) - (fieldname5/2 * (1 + fieldname9/100 - fieldname13/100));
            let magicalDamage = Math.floor(
                Math.max(
                    Math.floor(baseMagCalc) * (fieldname15 / 100),
                    0
                )
            );
            if (isNaN(magicalDamage) || !isFinite(magicalDamage)) magicalDamage = 0;
            
            // 総合ダメージ計算 (fieldname1)
            let elementalFactor = fieldname22 + fieldname18/100 - fieldname17/100; // fieldname17 is % from number input
            let skillElementalResistanceFactor = 1 - fieldname16/100;
            let statusRelatedDamageFactor = 1 + fieldname19/100 - fieldname50/100;
            let bbDamageUpFactor = 1 + fieldname20/100;

            let damageBeforeBBUp = (physicalDamage + magicalDamage) * elementalFactor * skillElementalResistanceFactor;
            damageBeforeBBUp = damageBeforeBBUp * statusRelatedDamageFactor;
            
            let totalDamage = Math.floor(damageBeforeBBUp) * bbDamageUpFactor;
            if (isNaN(totalDamage) || !isFinite(totalDamage)) totalDamage = 0;
            
            totalDamage = Math.floor(totalDamage); // 総合ダメージを切り捨て整数化

            // 結果表示
            UIManager.setResult('fieldname37', physicalDamage.toLocaleString()); // 切り捨て済み
            UIManager.setResult('fieldname38', magicalDamage.toLocaleString()); // 切り捨て済み
            UIManager.setResult('fieldname1', totalDamage.toLocaleString());    // 切り捨て済み

            // HP上限目安 (fieldname30)
            let hpThresholdBasis = 100 - fieldname29_val;
            let hpThreshold = 0;
            if (totalDamage > 0 && hpThresholdBasis > 0) { // Ensure totalDamage is positive for meaningful calculation
                hpThreshold = Math.floor(totalDamage * 100 / hpThresholdBasis); // 切り捨てに変更
            }
            if (isNaN(hpThreshold) || !isFinite(hpThreshold)) hpThreshold = 0;
            UIManager.setResult('fieldname30', hpThreshold.toLocaleString()); // 切り捨て済み

            // ダメージ割合(%) (fieldname42)
            let damagePercentage = 0;
            if (maxHP > 0 && totalDamage >= 0) { // totalDamage can be 0
                 damagePercentage = (totalDamage / maxHP * 100);
            }
            if (isNaN(damagePercentage) || !isFinite(damagePercentage)) damagePercentage = 0;
            UIManager.setResult('fieldname42', damagePercentage.toFixed(2)); // 小数点2位まで表示
        }
    }

    // Event Listeners Setup
    allInputFields.forEach(input => {
        if(input.dataset.field) { // Ensure event listeners are only for data fields
            input.addEventListener('input', Calculator.calculateAndDisplay);
            input.addEventListener('change', Calculator.calculateAndDisplay); // For number fields losing focus
        }
    });

    radioButtons.forEach(button => { // radioButtons are individual <button class="btn-radio">
        button.addEventListener('click', () => {
            const groupContainer = button.closest('.radio-button-group'); // Find parent container
            if (groupContainer) {
                const groupName = groupContainer.dataset.radioGroupField; // Get field name from parent
                const hiddenInput = inputForm.querySelector(`#${groupName}`); // Find hidden input by ID within the form
                if (hiddenInput) {
                    hiddenInput.value = button.dataset.value; // Set hidden input value from button's data-value
                    // Update active class for visual feedback within this group
                    groupContainer.querySelectorAll('.btn-radio').forEach(rb => rb.classList.remove('active'));
                    button.classList.add('active');
                    Calculator.calculateAndDisplay(); // Recalculate
                }
            }
        });
    });

    pmButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const step = parseFloat(button.dataset.step);
            const targetInput = inputForm.querySelector(`#${targetId}`); // Search within the form
            if (targetInput) {
                let currentValue = parseFloat(targetInput.value) || 0;
                targetInput.value = currentValue + step;
                Calculator.calculateAndDisplay();
            }
        });
    });

    buffButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const value = parseFloat(button.dataset.value);
            const targetInput = inputForm.querySelector(`#${targetId}`); // Search within the form
            if (targetInput) {
                targetInput.value = value;
                Calculator.calculateAndDisplay();
            }
        });
    });
    
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'manageForms') {
                UIManager.openFormModal();
            } else if (action === 'resetForm') {
                if (confirm('フォームの内容をリセットしますか？')) {
                    UIManager.resetForm();
                }
            } else if (action === 'closeFormModal') {
                UIManager.closeFormModal();
            }
        });
    });

    // Modal Form Actions
    saveFormBtn.addEventListener('click', () => {
        const name = formNameInput.value.trim();
        if (name) {
            const dataToSave = UIManager.getFormData();
            if (FormStorage.saveForm(name, dataToSave)) {
                UIManager.populateFormList(); // Refresh dropdown
                formNameInput.value = ''; // Clear input after save
                alert('フォーム「' + name + '」を保存/更新しました。');
            }
        } else {
            alert('フォーム名を入力してください。');
        }
    });

    loadFormBtn.addEventListener('click', () => {
        const name = formListSelect.value;
        if (name) {
            const formData = FormStorage.loadForm(name);
            if (formData) {
                UIManager.setFormData(formData);
                Calculator.calculateAndDisplay(); // Recalculate with loaded data
                UIManager.closeFormModal();
            } else {
                alert('選択されたフォームの読み込みに失敗しました。');
            }
        } else {
            alert('読み込むフォームを選択してください。');
        }
    });

    deleteFormBtn.addEventListener('click', () => {
        const name = formListSelect.value;
        if (name) {
            if (confirm('フォーム「' + name + '」を削除してもよろしいですか？')) {
                FormStorage.deleteForm(name); // This will also refresh the list
                alert('フォーム「' + name + '」を削除しました。');
            }
        } else {
            alert('削除するフォームを選択してください。');
        }
    });

    // --- Initial Setup ---
    UIManager.populateFormList(); // Populate profile list on load
    UIManager.resetForm(); // Reset form to default values and perform initial calculation
});
