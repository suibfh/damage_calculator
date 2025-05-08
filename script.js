document.addEventListener('DOMContentLoaded', () => {
    // 共通要素取得
    const allInputFields = Array.from(document.querySelectorAll('[data-field]'));
    const initialFormState = {};
    allInputFields.forEach(input => {
        initialFormState[input.dataset.field] = input.value;
    });

    // ボタン要素
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

    // モーダル関連
    const profileModal = document.getElementById('profileModal');
    // ...（既存ロジックはここに）

    // UIManager, ProfileManager, Calculator 定義
    // （元の script 部分をそのままここにコピーして、
    //  calculateBtn → calculateBtns.forEach(btn ⇒ btn.addEventListener…) に変更、
    //  manageProfilesBtn → manageProfileBtns… など、複製したボタン両方に対応させます）

    // イベントリスナーの登録
    calculateBtns.forEach(btn => btn.addEventListener('click', Calculator.calculateAndDisplay));
    resetFormBtns.forEach(btn => btn.addEventListener('click', UIManager.resetForm));
    manageProfileBtns.forEach(btn => btn.addEventListener('click', UIManager.openProfileModal));
    // モーダル閉じる・プロファイル保存なども同様に。

    // 初期化
    UIManager.populateProfileList();
    Calculator.calculateAndDisplay();
});
