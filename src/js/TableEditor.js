import productTableHTML from '../html/tableEditor.html';
import TableForm from './TableForm';
import ModalConfirm from './ModalConfirm';

export default class TableEditor {
  constructor(parentEl) {
    this.parentEl = parentEl;
    this.els = {
      tableEditor: null,
      table: null,
      rowHeader: null,
      btnAdd: null,
    };
    this.selectors = {
      tableEditor: '[data-widget="tableEditor"]',
      table: '[data-id="table"]',
      rowHeader: '[data-table="rowHeader"]',
      row: '[data-table="row"]',
      productName: '[data-row="productName"]',
      productCost: '[data-row="productCost"]',
      btnAdd: '[data-btn="add"]',
      btnEdit: '[data-btn="edit"]',
      btnDelete: '[data-btn="delete"]',
    };
    this.modalID = {
      tableForm: null,
      modalConfirm: null,
    };
    this.tableRows = new Map();
  }

  init() {
    const onTableEditorClick = this.onTableEditorClick.bind(this);
    this.parentEl.insertAdjacentHTML('beforeend', productTableHTML);

    this.els.tableEditor = this.parentEl.querySelector(this.selectors.tableEditor);

    this.els.table = this.els.tableEditor.querySelector(this.selectors.table);
    this.els.table.addEventListener('click', onTableEditorClick);

    this.els.rowHeader = this.els.tableEditor.querySelector(this.selectors.rowHeader);

    // Чтобы в разметеке не делать дополнительную обертку для таблицы и кнопки 'добавить',
    // событие onTableEditorClick нужно вешать на каждую из них.
    this.els.btnAdd = this.els.tableEditor.querySelector(this.selectors.btnAdd);
    this.els.btnAdd.addEventListener('click', onTableEditorClick);
    this.els.btnAdd.focus();

    this.modalID.tableForm = new TableForm(this.els.tableEditor);
    this.modalID.tableForm.init();

    this.modalID.modalConfirm = new ModalConfirm(this.els.tableEditor);
    this.modalID.modalConfirm.init();
  }

  async onTableEditorClick(event) {
    const { target } = event;

    if (target.dataset.id !== 'btn') return;

    const pressedBtn = target.dataset.btn;

    let modalTop;
    let rowData;
    let rowEl;

    if (pressedBtn === 'add') {
      const { height } = this.els.rowHeader.getBoundingClientRect();
      modalTop = `${this.els.rowHeader.offsetTop + height + 5}px`;
    } else if (pressedBtn === 'edit' || pressedBtn === 'delete') {
      const { height } = target.getBoundingClientRect();
      modalTop = `${target.offsetTop + height + 12}px`;
      rowEl = target.closest(this.selectors.row);

      if (pressedBtn === 'delete') {
        this.btnDeleteActions({ modalTop, rowEl });
        return;
      }
      rowData = this.tableRows.get(rowEl);
    }

    this.disableTable();
    this.modalID.tableForm.show(modalTop, rowData);
    const formResult = await this.modalID.tableForm.getResult();
    this.modalID.tableForm.hide();
    this.enableTable();
    if (formResult.status === 'cancel') return;

    if (pressedBtn === 'add') {
      this.addRow({ ...formResult.value });
    } if (pressedBtn === 'edit') {
      rowData.name = formResult.value.name;
      rowData.cost = formResult.value.cost;
    }
    this.updateTable();
  }

  async btnDeleteActions(args) {
    const { modalTop, rowEl } = args;
    this.disableTable();
    this.modalID.modalConfirm.show(modalTop);
    const confirmResult = await this.modalID.modalConfirm.getResult();
    this.modalID.modalConfirm.hide();
    this.enableTable();
    if (confirmResult.value === 'yes') {
      this.tableRows.delete(rowEl);
      this.updateTable();
    }
  }

  addRow(rowData) {
    const rowEl = document.createElement('tr');
    rowEl.dataset.table = 'row';
    rowEl.innerHTML = `
      <td data-row="productName">${rowData.name}</td>
      <td data-row="productCost" class="col2">${rowData.cost}</td>
      <td class="col3">
        <button data-id="btn" data-btn="edit" class="btn btn-edit">
          <span class="btn-text visually-hidden">Редактировать</span>
        </button>
      </td>
      <td class="col3">
        <button data-id="btn" data-btn="delete" class="btn btn-delete">
          <span class="btn-text visually-hidden">Удалить</span>
        </button>
      </td>
    `;
    this.tableRows.set(rowEl, rowData);
  }

  updateTable() {
    const oldRows = this.els.table.querySelectorAll(this.selectors.row);
    oldRows.forEach((oldRow) => oldRow.remove());
    this.tableRows.forEach((data, rowEl) => {
      const productNameEl = rowEl.querySelector(this.selectors.productName);
      const productCostEl = rowEl.querySelector(this.selectors.productCost);
      productNameEl.textContent = data.name;
      productCostEl.textContent = data.cost;
    });
    this.els.table.append(...this.tableRows.keys());
  }

  disableTable() {
    const btns = this.els.tableEditor.querySelectorAll(`
      ${this.selectors.btnAdd}, ${this.selectors.btnEdit}, ${this.selectors.btnDelete}`);
    btns.forEach((btn) => btn.setAttribute('disabled', ''));

    this.els.table.classList.add('shaded');
    this.els.btnAdd.classList.add('shaded');
  }

  enableTable() {
    const btns = this.els.tableEditor.querySelectorAll(`
      ${this.selectors.btnAdd}, ${this.selectors.btnEdit}, ${this.selectors.btnDelete}`);
    btns.forEach((btn) => btn.removeAttribute('disabled'));

    this.els.table.classList.remove('shaded');
    this.els.btnAdd.classList.remove('shaded');
    this.els.btnAdd.focus();
  }
}
