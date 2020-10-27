/* eslint-disable object-curly-newline */
import puppetteer from 'puppeteer';

jest.setTimeout(30000);

describe('TableEditor', () => {
  const els = {
    browser: null,
    page: null,

    // tableEditor
    te: {
      tableEditor: null,
      table: null,
      row: null,
      btnAdd: null,
      btnEdit: null,
      btnDelete: null,
    },

    // tableForm
    tf: {
      tableForm: null,
      btnCancel: null,
      btnSave: null,
      inputName: null,
      inputCost: null,
      errMsgName: null,
      errMsgCost: null,
    },

    // modalConfirm
    mc: {
      modalConfirm: null,
      btnYes: null,
      btnCancel: null,
    },
  };

  const productData = {
    name: 'Product 1',
    cost: '100',
  };

  const tests = {
    tableFormActive: async () => {
      const className = await els.tf.tableForm.getProperty('className').then((cn) => cn.jsonValue());
      expect(className.includes('hidden')).toBeFalsy();
    },

    tableFormClose: async () => {
      const className = await els.tf.tableForm.getProperty('className').then((cn) => cn.jsonValue());
      expect(className.includes('hidden')).toBeTruthy();
    },

    tableShaded: async () => {
      const cnTable = await els.te.table.getProperty('className').then((cn) => cn.jsonValue());
      expect(cnTable.includes('shaded')).toBeTruthy();

      const cnBtnAdd = await els.te.btnAdd.getProperty('className').then((cn) => cn.jsonValue());
      expect(cnBtnAdd.includes('shaded')).toBeTruthy();
    },

    tableActive: async () => {
      const cnTable = await els.te.table.getProperty('className').then((cn) => cn.jsonValue());
      expect(cnTable.includes('shaded')).toBeFalsy();

      const cnBtnAdd = await els.te.btnAdd.getProperty('className').then((cn) => cn.jsonValue());
      expect(cnBtnAdd.includes('shaded')).toBeFalsy();
    },
  };

  const baseUrl = 'http://localhost:9000';
  beforeEach(async () => {
    els.browser = await puppetteer.launch({
      // headless: false, // show gui
      // slowMo: 500,
      // devtools: false, // show devTools
    });
    els.page = await els.browser.newPage();
    await els.page.goto(baseUrl);
    els.te.tableEditor = await els.page.$('[data-widget="tableEditor"]');
    els.te.table = await els.te.tableEditor.$('[data-id="table"]');
    els.te.btnAdd = await els.te.tableEditor.$('[data-btn="add"]');

    els.tf.tableForm = await els.te.tableEditor.$('[data-modal-id="table-form"]');
    els.tf.btnCancel = await els.tf.tableForm.$('[data-btn="cancel"]');
    els.tf.btnSave = await els.tf.tableForm.$('[data-btn="save"]');
    els.tf.inputName = await els.tf.tableForm.$('[data-field="name"]');
    els.tf.inputCost = await els.tf.tableForm.$('[data-field="cost"]');
    els.tf.errMsgName = await els.tf.tableForm.$('[data-error-message="name"]');
    els.tf.errMsgCost = await els.tf.tableForm.$('[data-error-message="cost"]');
  });

  afterEach(async () => {
    await els.browser.close();
  });

  test('should create an empty table', async () => {
    els.te.row = await els.te.table.$$('[data-table="row"]');
    expect(els.te.row.length).toBe(0);
  });

  describe('On button click \'add\'', () => {
    beforeEach(async () => {
      await els.te.btnAdd.click();
    });

    test('should appear a modal window TableForm', async () => {
      await tests.tableFormActive();
    });

    test('the table and the \'add\' button should be shaded', async () => {
      await tests.tableShaded();
    });

    describe('On button click \'cancel\' on TableForm window', () => {
      beforeEach(async () => {
        await els.tf.btnCancel.click();
      });

      test('the TableForm window should close', async () => {
        await tests.tableFormClose();
      });

      test('the table and the \'add\' button should not be shaded', async () => {
        await tests.tableActive();
      });

      test('the number of rows in the table should not increase', async () => {
        els.te.row = await els.te.table.$$('[data-table="row"]');
        expect(els.te.row.length).toBe(0);
      });
    });

    describe('With correct data', () => {
      beforeEach(async () => {
        await els.tf.inputName.type(productData.name);
        await els.tf.inputCost.type(productData.cost);
      });

      describe('On button click \'save\' on TableForm window', () => {
        beforeEach(async () => {
          await els.tf.btnSave.click();
        });

        test('the TableForm window should close', async () => {
          await tests.tableFormClose();
        });

        test('the table and the \'add\' button should not be shaded', async () => {
          await tests.tableActive();
        });

        test('the number of rows in the table should increase', async () => {
          els.te.row = await els.te.table.$$('[data-table="row"]');
          expect(els.te.row.length).toBe(1);
        });

        test('the data in the table should be equal to the data from the form', async () => {
          const evlProductData = await els.page.evaluate(() => {
            const name = document.querySelector('[data-row="productName"]').textContent;
            const cost = document.querySelector('[data-row="productCost"]').textContent;
            return {
              name,
              cost,
            };
          });

          expect(evlProductData.name).toBe(productData.name);
          expect(evlProductData.cost).toBe(productData.cost);
        });
      });
    });

    describe('With incorrect data', () => {
      describe('On button click \'save\' on TableForm window', () => {
        beforeEach(async () => {
          await els.tf.btnSave.click();
        });

        test('the TableForm window should not close', async () => {
          await tests.tableFormActive();
        });

        test('the table and the \'add\' button should be shaded', async () => {
          await tests.tableShaded();
        });
      });

      describe('\'name\' and \'cost\' fields', () => {
        describe('No data was entered', () => {
          beforeEach(async () => {
            await els.tf.btnSave.click();
          });

          test.each([
            ['name', 'errMsgName'],
            ['cost', 'errMsgCost'],
          ])('an error should be shown under the \'%s\' field', async (field, errMsg) => {
            const className = await els.tf[errMsg].getProperty('className').then((cn) => cn.jsonValue());
            expect(className.includes('error-hidden')).toBeFalsy();
          });

          test.each`
            errMsgText             | errSelector                      | field
            ${'Введите название'}  | ${'[data-error-message="name"]'} | ${'name'}
            ${'Введите стоимость'} | ${'[data-error-message="cost"]'} | ${'cost'}
          `('error text under the \'$field\' field should be \'$errMsgText\'', async ({ errMsgText, errSelector }) => {
            const evlErrMsgName = await els.page.evaluate((paramErrSelector) => {
              // Вычисляет содержимое свойства 'content' у псевдоэлемента
              const text = window.getComputedStyle(document.querySelector(paramErrSelector), '::after')
                .getPropertyValue('content')
                .replace(/"/g, ''); // Убирает лишние кавычки
              return {
                text,
              };
            }, errSelector);

            expect(evlErrMsgName.text).toBe(errMsgText);
          });
        });
      });

      describe('\'cost\' field', () => {
        test.each`
            inputDataType            | inputData   | errMsgText
            ${'a negative number'}   | ${'-1000'}  | ${'Число должно быть больше нуля'}
            ${'a fractional number'} | ${'100.25'} | ${'Число должно быть целым'}
          `('when entering $inputDataType (\'$inputData\'), the error text must be \'$errMsgText\'', async ({ inputData, errMsgText }) => {
          await els.tf.inputCost.type(inputData);
          await els.tf.btnSave.click();
          const evlErrMsgName = await els.page.evaluate(() => {
            // Вычисляет содержимое свойства 'content' у псевдоэлемента
            const text = window.getComputedStyle(document.querySelector('[data-error-message="cost"]'), '::after')
              .getPropertyValue('content')
              .replace(/"/g, ''); // Убирает лишние кавычки
            return {
              text,
            };
          });

          expect(evlErrMsgName.text).toBe(errMsgText);
        });
      });
    });
  });

  describe('Click on a button in a row', () => {
    beforeEach(async () => {
      await els.te.btnAdd.click();
      await els.tf.inputName.type(productData.name);
      await els.tf.inputCost.type(productData.cost);
      await els.tf.btnSave.click();
    });

    describe('On button click \'edit\'', () => {
      beforeEach(async () => {
        els.te.btnEdit = await els.te.table.$('[data-btn="edit"]');
        await els.te.btnEdit.click();
      });

      test('should appear a modal window TableForm', async () => {
        await tests.tableFormActive();
      });

      test('the table and the \'add\' button should be shaded', async () => {
        await tests.tableShaded();
      });

      test('the data in the form should be equal to the data from the table', async () => {
        const evlProductData = await els.page.evaluate(() => {
          const name = document.querySelector('[data-field="name"]').value;
          const cost = document.querySelector('[data-field="cost"]').value;
          return {
            name,
            cost,
          };
        });

        expect(evlProductData.name).toBe(productData.name);
        expect(evlProductData.cost).toBe(productData.cost);
      });
    });

    describe('On button click \'delete\'', () => {
      beforeEach(async () => {
        els.mc.modalConfirm = await els.te.tableEditor.$('[data-modal-id="confirm"]');
        els.mc.btnYes = await els.mc.modalConfirm.$('[data-btn="yes"]');
        els.mc.btnCancel = await els.mc.modalConfirm.$('[data-btn="cancel"]');

        els.te.btnDelete = await els.te.table.$('[data-btn="delete"]');
        await els.te.btnDelete.click();
      });

      test('should appear a modal window ModalConfirm', async () => {
        const className = await els.mc.modalConfirm.getProperty('className').then((cn) => cn.jsonValue());
        expect(className.includes('hidden')).toBeFalsy();
      });

      test('the table and the \'add\' button should be shaded', async () => {
        await tests.tableShaded();
      });

      describe.each`
        btnTitle    | btnEl          | rowCount | testText
        ${'cancel'} | ${'btnCancel'} | ${1}     | ${'not '}
        ${'yes'}    | ${'btnYes'}    | ${0}     | ${''}
      `('On button click on ModalConfirm window', ({ btnTitle, btnEl, rowCount, testText }) => {
        test(`on button click '${btnTitle}', ModalConfirm window should close`, async () => {
          await els.mc[btnEl].click();
          const cnModalConfirm = await els.mc.modalConfirm.getProperty('className').then((cn) => cn.jsonValue());
          expect(cnModalConfirm.includes('hidden')).toBeTruthy();
        });

        test(`on button click '${btnTitle}', the table and the 'add' button should not be shaded`, async () => {
          await els.mc[btnEl].click();
          await tests.tableActive();
        });

        test(`on button click '${btnTitle}', the row should ${testText}be deleted`, async () => {
          await els.mc[btnEl].click();
          els.te.row = await els.te.table.$$('[data-table="row"]');
          expect(els.te.row.length).toBe(rowCount);
        });
      });
    });
  });
});
