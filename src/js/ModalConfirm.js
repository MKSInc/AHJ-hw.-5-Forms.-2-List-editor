import modalConfirmHTML from '../html/modalConfirm.html';

export default class ModalConfirm {
  constructor(parentEl) {
    this.parentEl = parentEl;
    this.els = {
      confirm: null,
      btnYes: null,
    };

    this.selectors = {
      confirm: '[data-modal-id="confirm"]',
      btnYes: '[data-btn="yes"]',
    };

    this.resolve = null;
    this.result = { value: null };
  }

  init() {
    this.parentEl.insertAdjacentHTML('beforeend', modalConfirmHTML);
    this.els.confirm = this.parentEl.querySelector(this.selectors.confirm);
    this.els.confirm.addEventListener('click', this.onConfirmClick.bind(this));
    this.els.confirm.addEventListener('keydown', this.onConfirmKeydown.bind(this));

    this.els.btnYes = this.parentEl.querySelector(this.selectors.btnYes);
  }

  onConfirmClick(event) {
    const { target } = event;
    if (target.dataset.id !== 'btn') return;

    if (target.dataset.btn === 'yes') this.result.value = 'yes';
    if (target.dataset.btn === 'cancel') this.result.value = 'cancel';
    this.resolve(this.result);
  }

  onConfirmKeydown(event) {
    if (event.code === 'Escape') {
      this.result.value = 'cancel';
      this.resolve(this.result);
    }
  }

  show(modalTop) {
    this.els.confirm.style.top = modalTop;
    this.els.confirm.classList.remove('hidden');
    this.els.btnYes.focus();
  }

  hide() {
    this.els.confirm.classList.add('hidden');
  }

  getResult() {
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
}
