document.addEventListener('DOMContentLoaded', () => {
    const LS_FORMS_KEY = 'bfhDamageCalcForms_v3'; // Changed localStorage key
    const LS_AUTO_SAVE_KEY = 'bfhDamageCalcFormState_v3'; // Changed localStorage key
    let initialFormState = {};

    const UIManager = {
        allInputFields: [],
        resultElements: {},
        formModal: null, // Added reference to modal
        formModalOverlay: null, // Added reference to modal overlay
        _recalculateTimeout: null,

        init() {
            this.allInputFields = Array.from(document.querySelectorAll('[data-field]'));
            this.resultElements = {
                fieldname37: document.getElementById('result_fieldname37'),
                fieldname38: document.getElementById('result_fieldname38'),
                fieldname1: document.getElementById('result_fieldname1'),
                fieldname30: document.getElementById('result_fieldname30'),
                fieldname42: document.getElementById('result_fieldname42'),
            };
            this.formModal = document.getElementById('formModal'); // Get modal element
            
            // Create and append overlay if it doesn't exist
            this.formModalOverlay = document.querySelector('.modal-overlay');
            if (!this.formModalOverlay) {
                this.formModalOverlay = document.createElement('div');
                this.formModalOverlay.className = 'modal-overlay';
                document.body.appendChild(this.formModalOverlay);
            }


            this.captureInitialFormState();
            this.loadFormState();
            this.setupEventListeners();
            this.updateAllRadioGroupVisuals();
            this.updateAllBuffButtonVisuals();
        },

        captureInitialFormState() {
            initialFormState = {};
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (input.type === 'hidden' && input.closest('.radio-button-group')) {
                    const group = input.closest('.radio-button-group');
                    const activeButton = group.querySelector('.btn-radio.active');
                    initialFormState[fieldName] = activeButton ? activeButton.dataset.value : input.value;
                } else {
                    initialFormState[fieldName] = input.value;
                }
            });
        },

        setupEventListeners() {
            document.querySelectorAll('.js-action-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    switch(action) {
                        case 'manageForms': // Changed action name
                            this.openFormModal();
                            break;
                        case 'resetForm':
                            this.resetForm();
                            break;
                        case 'closeFormModal': // Changed action name
                            this.closeFormModal();
                            break;
                    }
                });
            });

            document.getElementById('saveFormBtn').addEventListener('click', () => FormManager.handleSaveForm()); // Changed ID
            document.getElementById('loadFormBtn').addEventListener('click', () => FormManager.handleLoadForm()); // Changed ID
            document.getElementById('deleteFormBtn').addEventListener('click', () => FormManager.handleDeleteForm()); // Changed ID

            // Close modal if overlay is clicked
            this.formModalOverlay.addEventListener('click', () => this.closeFormModal());
            
            // Close modal if escape key is pressed
             window.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.formModal.style.display === 'block') {
                    this.closeFormModal();
                }
            });


            document.querySelectorAll('.pm-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetId = e.target.dataset.target;
                    const step = parseInt(e.target.dataset.step, 10);
                    this.handleNumberButtonClick(targetId, step);
                });
            });

            document.querySelectorAll('.radio-button-group .btn-radio').forEach(button => {
                button.addEventListener('click', (e) => {
                    const group = e.target.closest('.radio-button-group');
                    const targetField = group.dataset.radioGroupField;
                    const value = e.target.dataset.value;
                    this.handleRadioSelection(targetField, value, group);
                });
            });

            document.querySelectorAll('.buff-buttons .buff-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetId = e.target.dataset.target;
                    const value = e.target.dataset.value;
                    this.handleBuffSelection(targetId, value);
                });
            });

            this.allInputFields.forEach(input => {
                input.addEventListener('change', () => {
                    this.saveCurrentFormState();
                    Calculator.calculateAndDisplay();
                });
                if (input.type === 'number') {
                    input.addEventListener('input', () => {
                        this.saveCurrentFormStateDebounced();
                        this.recalculateDebounced();
                    });
                }
            });
        },

        handleNumberButtonClick(fieldId, step) {
            const inputElement = document.getElementById(fieldId);
            if (inputElement && inputElement.type === 'number') {
                let currentValue = parseFloat(inputElement.value) || 0;
                inputElement.value = currentValue + step;
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                this.updateBuffButtonVisuals(fieldId);
            }
        },

        handleRadioSelection(fieldId, value, groupElement) {
            const hiddenInput = document.getElementById(fieldId);
            if (hiddenInput) {
                hiddenInput.value = value;
                groupElement.querySelectorAll('.btn-radio').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === value);
                });
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        },

        handleBuffSelection(fieldId, value) {
            const inputElement = document.getElementById(fieldId);
            if (inputElement) {
                inputElement.value = value;
                this.updateBuffButtonVisuals(fieldId);
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
        },

        updateRadioGroupVisuals(fieldIdOfHiddenInput) {
            const hiddenInput = document.getElementById(fieldIdOfHiddenInput);
            if (hiddenInput && hiddenInput.type === 'hidden') {
                 const group = hiddenInput.closest('.form-group')?.querySelector(`.radio-button-group[data-radio-group-field="${fieldIdOfHiddenInput}"]`);
                 if (group) {
                    const currentValue = hiddenInput.value;
                    group.querySelectorAll('.btn-radio').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.value === currentValue);
                    });
                 }
            }
        },

        updateAllRadioGroupVisuals() {
            document.querySelectorAll('input[type="hidden"][data-field]').forEach(hiddenInput => {
                if (hiddenInput.closest('.form-group')?.querySelector(`.radio-button-group[data-radio-group-field="${hiddenInput.id}"]`)) {
                    this.updateRadioGroupVisuals(hiddenInput.id);
                }
            });
        },

        updateBuffButtonVisuals(fieldId) {
            const inputElement = document.getElementById(fieldId);
            const formGroup = inputElement?.closest('.form-group');
            if (!formGroup) return;

            const buffButtonGroup = formGroup.querySelector('.buff-buttons');
            if (inputElement && buffButtonGroup) {
                const currentValue = inputElement.value;
                buffButtonGroup.querySelectorAll('.buff-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === currentValue && btn.dataset.target === fieldId);
                });
            }
        },

        updateAllBuffButtonVisuals() {
            this.allInputFields.forEach(input => {
                if (input.type === 'number') {
                     this.updateBuffButtonVisuals(input.id);
                }
            });
        },

        getFormData() {
            const data = {};
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                data[fieldName] = (input.type === 'number' && input.value === '') ? '0' : input.value;
            });
            return data;
        },

        setFormData(data) {
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (data.hasOwnProperty(fieldName)) {
                    input.value = data[fieldName];
                }
            });
            this.updateAllRadioGroupVisuals();
            this.updateAllBuffButtonVisuals();
            Calculator.calculateAndDisplay();
        },

        displayResults(results) {
            for (const key in results) {
                if (this.resultElements[key]) {
                    const value = results[key];
                    let displayValue;
                    if (typeof value === 'number') {
                        if (Number.isInteger(value)) {
                            displayValue = value;
                        } else if (key === 'fieldname42') {
                            displayValue = value.toFixed(2);
                        }
                        else {
                             displayValue = Math.floor(value);
                        }
                    } else {
                         displayValue = value;
                    }
                     this.resultElements[key].textContent = displayValue;
                }
            }
        },

        resetForm() {
            if (confirm('フォームの入力内容を初期状態にリセットしますか？（自動保存された内容は上書きされます）')) {
                this.setFormData(initialFormState);
                this.saveCurrentFormState();
            }
        },

        openFormModal() { // Changed method name
            this.formModal.style.display = 'block';
            this.formModalOverlay.style.display = 'block';
            FormManager.populateFormList(); // Changed call
            document.getElementById('formNameInput').value = ''; // Changed ID
        },

        closeFormModal() { // Changed method name
            this.formModal.style.display = 'none';
            this.formModalOverlay.style.display = 'none';
        },

        saveCurrentFormState() {
            const formData = this.getFormData();
            localStorage.setItem(LS_AUTO_SAVE_KEY, JSON.stringify(formData));
        },

        _saveTimeout: null,
        saveCurrentFormStateDebounced() {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = setTimeout(() => {
                this.saveCurrentFormState();
            }, 300);
        },

        recalculateDebounced() {
            clearTimeout(this._recalculateTimeout);
            this._recalculateTimeout = setTimeout(() => {
                Calculator.calculateAndDisplay();
            }, 350);
        },

        loadFormState() {
            const savedState = localStorage.getItem(LS_AUTO_SAVE_KEY);
            if (savedState) {
                try {
                    const formData = JSON.parse(savedState);
                    this.setFormData(formData);
                } catch (e) {
                    console.error("Error parsing auto-saved state from localStorage:", e);
                    localStorage.removeItem(LS_AUTO_SAVE_KEY);
                    this.setFormData(initialFormState);
                }
            } else {
                 this.setFormData(initialFormState);
            }
        }
    };

    const FormManager = { // Changed object name
        formNameInput: document.getElementById('formNameInput'), // Changed ID
        formListSelect: document.getElementById('formList'), // Changed ID

        loadForms: () => { // Changed method name
            const forms = localStorage.getItem(LS_FORMS_KEY);
            return forms ? JSON.parse(forms) : {};
        },
        saveForm: (name, data) => { // Changed method name
            if (!name) {
                alert('フォーム名を入力してください。');
                return false;
            }
            const forms = FormManager.loadForms(); // Changed call
            forms[name] = data;
            localStorage.setItem(LS_FORMS_KEY, JSON.stringify(forms));
            return true;
        },
        deleteForm: (name) => { // Changed method name
            if (!name) return false;
            const forms = FormManager.loadForms(); // Changed call
            delete forms[name];
            localStorage.setItem(LS_FORMS_KEY, JSON.stringify(forms));
            return true;
        },
        getForm: (name) => { // Changed method name
            const forms = FormManager.loadForms(); // Changed call
            return forms[name];
        },
        populateFormList: () => { // Changed method name
            const forms = FormManager.loadForms(); // Changed call
            FormManager.formListSelect.innerHTML = '<option value="">--- 保存済みフォームを選択 ---</option>';
            for (const name in forms) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                FormManager.formListSelect.appendChild(option);
            }
        },
        handleSaveForm: () => { // Changed method name
            const name = FormManager.formNameInput.value.trim();
            const currentFormData = UIManager.getFormData();
            if (FormManager.saveForm(name, currentFormData)) { // Changed call
                alert(`フォーム「${name}」を保存しました。`);
                FormManager.populateFormList(); // Changed call
                FormManager.formNameInput.value = '';
            }
        },
        handleLoadForm: () => { // Changed method name
            const name = FormManager.formListSelect.value;
            if (name) {
                const formData = FormManager.getForm(name); // Changed call
                if (formData) {
                    UIManager.setFormData(formData);
                    UIManager.saveCurrentFormState();
                    UIManager.closeFormModal(); // Changed call
                    alert(`フォーム「${name}」を読み込みました。`);
                } else {
                    alert("選択されたフォームの読み込みに失敗しました。");
                }
            } else {
                alert('読み込むフォームを選択してください。');
            }
        },
        handleDeleteForm: () => { // Changed method name
            const name = FormManager.formListSelect.value;
            if (name) {
                if (confirm(`フォーム「${name}」を削除してもよろしいですか？`)) {
                    if (FormManager.deleteForm(name)) { // Changed call
                        alert(`フォーム「${name}」を削除しました。`);
                        FormManager.populateFormList(); // Changed call
                    }
                }
            } else {
                alert('削除するフォームを選択してください。');
            }
        }
    };

    const Calculator = { // Calculation logic remains the same
        getNumericValue(data, fieldName, defaultValue = 0) {
            const valStr = data[fieldName];
            if (valStr === undefined || valStr === null || String(valStr).trim() === '') return defaultValue;
            const val = parseFloat(valStr);
            return isNaN(val) ? defaultValue : val;
        },

        calculateAttackDamage: (data) => {
            const f2 = Calculator.getNumericValue(data, 'fieldname2');
            const f4 = Calculator.getNumericValue(data, 'fieldname4');
            const f6 = Calculator.getNumericValue(data, 'fieldname6') / 100;
            const f8 = Calculator.getNumericValue(data, 'fieldname8') / 100;
            const f10 = Calculator.getNumericValue(data, 'fieldname10') / 100;
            const f12 = Calculator.getNumericValue(data, 'fieldname12') / 100;
            const f14 = Calculator.getNumericValue(data, 'fieldname14', 100) / 100;

            const term1 = f2 * (1 + f6 - f10);
            const term2 = (f4 / 2) * (1 + f8 - f12);
            const baseDamage = Math.floor(term1 - term2);
            return Math.max(baseDamage * f14, 0);
        },

        calculateMagicDamage: (data) => {
            const f3 = Calculator.getNumericValue(data, 'fieldname3');
            const f5 = Calculator.getNumericValue(data, 'fieldname5');
            const f7 = Calculator.getNumericValue(data, 'fieldname7') / 100;
            const f9 = Calculator.getNumericValue(data, 'fieldname9') / 100;
            const f11 = Calculator.getNumericValue(data, 'fieldname11') / 100;
            const f13 = Calculator.getNumericValue(data, 'fieldname13') / 100;
            const f15 = Calculator.getNumericValue(data, 'fieldname15', 100) / 100;

            const term1 = f3 * (1 + f7 - f11);
            const term2 = (f5 / 2) * (1 + f9 - f13);
            const baseDamage = Math.floor(term1 - term2);
            return Math.max(baseDamage * f15, 0);
        },

        calculateTotalDamage: (data, atkDmg, magDmg) => {
            const f16 = Calculator.getNumericValue(data, 'fieldname16') / 100;
            const f17 = Calculator.getNumericValue(data, 'fieldname17') / 100;
            const f18 = Calculator.getNumericValue(data, 'fieldname18') / 100;
            const f19 = Calculator.getNumericValue(data, 'fieldname19') / 100;
            const f20_raw = Calculator.getNumericValue(data, 'fieldname20');
            const f22 = Calculator.getNumericValue(data, 'fieldname22', 1);
            const f50 = Calculator.getNumericValue(data, 'fieldname50') / 100;

            const sumOfDamages = atkDmg + magDmg;

            let modifiedDamage = sumOfDamages * (f22 + f18 - f17);
            modifiedDamage = modifiedDamage * (1 - f16);
            modifiedDamage = modifiedDamage * (1 - f50);
            modifiedDamage = modifiedDamage * (1 + f19);

            const flooredModifiedDamage = Math.floor(modifiedDamage);
            const finalTotalDamage = flooredModifiedDamage * (100 + f20_raw) / 100;

            return Math.floor(finalTotalDamage);
        },

        calculateHpThreshold: (totalDamage, data) => {
            const f29 = Calculator.getNumericValue(data, 'fieldname29', 30);
            if (f29 >= 100 || f29 <= 0) return Infinity;
            if (totalDamage <= 0) return 0;
            const threshold = totalDamage / ((100 - f29) / 100);
            return Math.round(threshold);
        },

        calculateDamagePercentage: (totalDamage, data) => {
            const f41 = Calculator.getNumericValue(data, 'fieldname41');
            if (f41 <= 0 || totalDamage <= 0) return 0;
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

    UIManager.init();

});
