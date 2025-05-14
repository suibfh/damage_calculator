document.addEventListener('DOMContentLoaded', () => {
    const allInputFields = document.querySelectorAll('#inputForm input[data-field]');
    const radioButtons = document.querySelectorAll('.btn-radio[data-radio-group-field]');
    const pmButtons = document.querySelectorAll('.pm-btn');
    const buffButtons = document.querySelectorAll('.buff-btn');
    const actionButtons = document.querySelectorAll('.js-action-btn');

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
                if (input.type === 'number') {
                    data[input.dataset.field] = parseFloat(input.value) || 0;
                } else if (input.type === 'hidden' && input.dataset.field) {
                    data[input.dataset.field] = parseFloat(input.value) || (input.dataset.field === 'fieldname22' ? 1 : 0);
                } else {
                    data[input.dataset.field] = input.value;
                }
            });
            return data;
        }

        static setFormData(data) {
            allInputFields.forEach(input => {
                if (data.hasOwnProperty(input.dataset.field)) {
                    input.value = data[input.dataset.field];
                    if (input.type === 'hidden') {
                        const groupName = input.dataset.field;
                        const radioGroup = document.querySelector(`.radio-button-group[data-radio-group-field="${groupName}"]`);
                        if (radioGroup) {
                            radioGroup.querySelectorAll('.btn-radio').forEach(radio => {
                                if (radio.dataset.value === input.value) {
                                    radio.classList.add('active');
                                } else {
                                    radio.classList.remove('active');
                                }
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
                if (input.type === 'number') {
                    if (field === 'fieldname14' || field === 'fieldname15') { // 攻撃倍率, 魔攻倍率
                        input.value = '100';
                    } else if (field === 'fieldname29') { // 全体BB発動HP
                        input.value = '30';
                    } else if (field === 'fieldname41') { // 最大HP
                        input.value = ''; // 空にする
                    } else {
                        input.value = '0';
                    }
                } else if (input.type === 'hidden') { // Radio button groups
                    const defaultValue = field === 'fieldname22' ? '1' : '0';
                    input.value = defaultValue;
                    const radioGroup = document.querySelector(`.radio-button-group[data-radio-group-field="${field}"]`);
                    if (radioGroup) {
                        radioGroup.querySelectorAll('.btn-radio').forEach(radio => {
                            radio.classList.toggle('active', radio.dataset.value === defaultValue);
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
                document.querySelector('.modal-overlay').addEventListener('click', UIManager.closeFormModal);
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
            formListSelect.innerHTML = '<option value="">保存データを選択</option>'; // プルダウン初期化
            forms.forEach(form => {
                const option = document.createElement('option');
                option.value = form.name;
                option.textContent = form.name;
                formListSelect.appendChild(option);
            });
        }
    }

    class FormStorage {
        static getAllForms() {
            const forms = localStorage.getItem('bfhCalcFormsV4'); // Changed key for this version
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
                forms[existingIndex].data = data;
            } else {
                forms.push({ name, data });
            }
            localStorage.setItem('bfhCalcFormsV4', JSON.stringify(forms));
            return true;
        }

        static loadForm(name) {
            const forms = FormStorage.getAllForms();
            const formData = forms.find(form => form.name === name);
            return formData ? formData.data : null; // Return only data part
        }

        static deleteForm(name) {
            let forms = FormStorage.getAllForms();
            forms = forms.filter(form => form.name !== name);
            localStorage.setItem('bfhCalcFormsV4', JSON.stringify(forms));
            return true;
        }
    }

    class Calculator {
        static calculateAndDisplay() {
            const data = UIManager.getFormData();

            const fieldname2 = parseFloat(data.fieldname2) || 0;
            const fieldname3 = parseFloat(data.fieldname3) || 0;
            const fieldname6 = parseFloat(data.fieldname6) || 0;
            const fieldname7 = parseFloat(data.fieldname7) || 0;
            const fieldname10 = parseFloat(data.fieldname10) || 0;
            const fieldname11 = parseFloat(data.fieldname11) || 0;
            const fieldname4 = parseFloat(data.fieldname4) || 0;
            const fieldname5 = parseFloat(data.fieldname5) || 0;
            const fieldname8 = parseFloat(data.fieldname8) || 0;
            const fieldname9 = parseFloat(data.fieldname9) || 0;
            const fieldname12 = parseFloat(data.fieldname12) || 0;
            const fieldname13 = parseFloat(data.fieldname13) || 0;
            const fieldname14 = parseFloat(data.fieldname14) || 0;
            const fieldname15 = parseFloat(data.fieldname15) || 0;

            const fieldname18 = parseFloat(data.fieldname18) || 0;
            const fieldname17 = parseFloat(data.fieldname17) || 0;
            const fieldname16 = parseFloat(data.fieldname16) || 0;
            const fieldname19 = parseFloat(data.fieldname19) || 0;
            const fieldname50 = parseFloat(data.fieldname50) || 0;
            const fieldname22 = parseFloat(data.fieldname22) || 1;
            const fieldname20 = parseFloat(data.fieldname20) || 0;
            const fieldname29_val = parseFloat(data.fieldname29) || 0;
            const maxHP = parseFloat(data.fieldname41) || 0;

            let baseAtkCalc = (fieldname2 * (1 + fieldname6/100 - fieldname10/100)) - (fieldname4/2 * (1 + fieldname8/100 - fieldname12/100));
            let physicalDamage = Math.floor(
                Math.max(
                    Math.floor(baseAtkCalc) * (fieldname14 / 100),
                    0
                )
            );
            if (isNaN(physicalDamage) || !isFinite(physicalDamage)) physicalDamage = 0;

            let baseMagCalc = (fieldname3 * (1 + fieldname7/100 - fieldname11/100)) - (fieldname5/2 * (1 + fieldname9/100 - fieldname13/100));
            let magicalDamage = Math.floor(
                Math.max(
                    Math.floor(baseMagCalc) * (fieldname15 / 100),
                    0
                )
            );
            if (isNaN(magicalDamage) || !isFinite(magicalDamage)) magicalDamage = 0;
            
            let elementalFactor = fieldname22 + fieldname18/100 - fieldname17/100;
            let skillElementalResistanceFactor = 1 - fieldname16/100;
            let statusRelatedDamageFactor = 1 + fieldname19/100 - fieldname50/100;
            let bbDamageUpFactor = 1 + fieldname20/100;

            let damageBeforeBBUp = (physicalDamage + magicalDamage) * elementalFactor * skillElementalResistanceFactor;
            damageBeforeBBUp = damageBeforeBBUp * statusRelatedDamageFactor;
            
            let totalDamage = Math.floor(damageBeforeBBUp) * bbDamageUpFactor;
            if (isNaN(totalDamage) || !isFinite(totalDamage)) totalDamage = 0;

            UIManager.setResult('fieldname37', physicalDamage.toLocaleString());
            UIManager.setResult('fieldname38', magicalDamage.toLocaleString());
            
            const totalDamageDisplay = Number.isInteger(totalDamage) 
                ? totalDamage.toLocaleString() 
                : parseFloat(totalDamage.toFixed(1)).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1});
            UIManager.setResult('fieldname1', totalDamageDisplay);

            let hpThresholdBasis = 100 - fieldname29_val;
            let hpThreshold = 0;
            if (totalDamage > 0 && hpThresholdBasis > 0) {
                hpThreshold = Math.round(totalDamage * 100 / hpThresholdBasis);
            }
            if (isNaN(hpThreshold) || !isFinite(hpThreshold)) hpThreshold = 0;
            UIManager.setResult('fieldname30', hpThreshold.toLocaleString());

            let damagePercentage = 0;
            if (maxHP > 0 && totalDamage >= 0) { // totalDamage can be 0
                 damagePercentage = (totalDamage / maxHP * 100);
            }
            if (isNaN(damagePercentage) || !isFinite(damagePercentage)) damagePercentage = 0;
            UIManager.setResult('fieldname42', damagePercentage.toFixed(2));
        }
    }

    // Event Listeners Setup
    allInputFields.forEach(input => {
        input.addEventListener('input', Calculator.calculateAndDisplay);
        input.addEventListener('change', Calculator.calculateAndDisplay);
    });

    radioButtons.forEach(button => {
        button.addEventListener('click', () => {
            const groupName = button.dataset.radioGroupField;
            const hiddenInput = document.getElementById(groupName);
            if (hiddenInput) {
                hiddenInput.value = button.dataset.value;
                const groupContainer = button.closest('.radio-button-group');
                groupContainer.querySelectorAll('.btn-radio').forEach(rb => rb.classList.remove('active'));
                button.classList.add('active');
                Calculator.calculateAndDisplay();
            }
        });
    });

    pmButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const step = parseFloat(button.dataset.step);
            const targetInput = document.getElementById(targetId);
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
            const targetInput = document.getElementById(targetId);
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

    saveFormBtn.addEventListener('click', () => {
        const name = formNameInput.value.trim();
        if (name) {
            const dataToSave = UIManager.getFormData();
            if (FormStorage.saveForm(name, dataToSave)) {
                UIManager.populateFormList();
                formNameInput.value = '';
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
                Calculator.calculateAndDisplay();
                UIManager.closeFormModal();
            } else {
                alert('フォームの読み込みに失敗しました。');
            }
        } else {
            alert('読み込むフォームを選択してください。');
        }
    });

    deleteFormBtn.addEventListener('click', () => {
        const name = formListSelect.value;
        if (name) {
            if (confirm('フォーム「' + name + '」を削除してもよろしいですか？')) {
                if (FormStorage.deleteForm(name)) {
                    UIManager.populateFormList();
                    alert('フォーム「' + name + '」を削除しました。');
                }
            }
        } else {
            alert('削除するフォームを選択してください。');
        }
    });

    // Initial Setup
    UIManager.populateFormList();
    UIManager.resetForm(); // This will also call Calculator.calculateAndDisplay()
});
