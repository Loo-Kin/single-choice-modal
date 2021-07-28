"use strict";

$(() => {
    let session = new Session();

    // Загрузка JSON и создание таблиц
    session.loadPersons();
    session.loadPositions();
    session.loadOrgs().always(() => {
        session.loadSubs();
    });



    // Создание обработчиков для кнопок
    $("#selectPersonButton").on("click", () => {
        session.showPersonsModal();
    });

    $("#selectPositionButton").on("click", () => {
        session.showPositionsModal();
    });

    $("#selectOrgButton").on("click", () => {
        session.showOrgsModal();
    });

    $("#selectSubButton").on("click", () => {
        session.showSubsModal();
    });
});

/**
 * Сессия - основной класс, содержащий все необходимые данные и методы манипуляции с ними.
 */
class Session {
    /**
     * 
     * @param {Array} persons Сотрудники
     * @param {Array} positions Должности
     * @param {Array} orgs Организации
     * @param {Array} subs Подразделения
     */
    constructor(persons, positions, orgs, subs) {
        this.persons = persons;
        this.positions = positions;
        this.orgs = orgs;
        this.subs = subs;

        this.personsTable;
        this.positionsTable;
        this.orgsTable;
        this.subsTable;

        this.selectedPerson;
        this.selectedPosition;
        this.selectedOrg;
        this.selectedSub;

        this.updateCurrentDate();

        setInterval(() => {
            this.updateCurrentDate();
        }, 1000);
    }

    /**
     * Обновить текущую дату и время.
     */
    updateCurrentDate() {
        this.now = new Date();
        $(".currentDate").html(this.now);
    }

    /**
     * Загрузить сотрудников из JSON
     * @returns Массив сотрудников
     */
    loadPersons() {
        return $.getJSON('./data/persons.json', (data) => {
            this.persons = data;
        }).fail(() => {
            let errorModal = new Modal(
                "errorModal1",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }).done(() => {
            this.persons.sort(ComparePersons);
            this.personsTable = new Table(
                [
                    { name: "lastname", displayName: "Фамилия" },
                    { name: "middlename", displayName: "Имя" },
                    { name: "firstname", displayName: "Отчество" },
                    { name: "birthday", displayName: "Дата рождения" }
                ], this.persons);
        });
    }

    /**
     * Загрузить должности из JSON
     * @returns Массив должностей
     */
    loadPositions() {
        return $.getJSON('./data/positions.json', (data) => {
            this.positions = data;
        }).fail(() => {
            let errorModal = new Modal(
                "errorModal2",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }).done(() => {
            this.positions.sort(CompareNames);
            this.positionsTable = new Table(
                [
                    { name: "name", displayName: "Название должности" },
                    { name: "min_age", displayName: "Мин. возраст" },
                    { name: "max_age", displayName: "Макс. возраст" }
                ], this.positions);
        });
    }

    /**
     * Загрузить организации из JSON
     * @returns Массив организаций
     */
    loadOrgs() {
        return $.getJSON('./data/orgs.json', (data) => {
            this.orgs = data;
        }).fail(() => {
            let errorModal = new Modal(
                "errorModal3",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }).done(() => {
            this.orgs.sort(CompareNames);
            this.orgsTable = new Table(
                [
                    { name: "name", displayName: "Название" },
                    { name: "country", displayName: "Страна" }
                ], this.orgs);
        });
    }

    /**
     * Загрузить подразделения из JSON
     * @returns Массив подразделений
     */
    loadSubs() {
        return $.getJSON('./data/subs.json', (data) => {
            this.subs = data;
        }).fail(() => {
            let errorModal = new Modal(
                "errorModal4",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }).done(() => {
            this.subs.sort(CompareNames);
            this.subs.forEach(element => {
                if (this.orgs !== undefined) {
                    element.org_name = this.orgs.find(item => item.id === element.org_id).name;
                } else {
                    element.org_name = "";
                }
            });
            this.subsTable = new Table(
                [
                    { name: "name", displayName: "Название" },
                    { name: "org_name", displayName: "Организация" }
                ], this.subs);
        });
    }

    /**
     * Отобразить модальное окно Сотрудник
     */
    showPersonsModal() {
        try {
            let modal = new Modal(
                "personsModal",
                "Выбор сотрудника",
                this.personsTable.getTable(),
                [
                    {
                        content: "OK",
                        role: "button__OK",
                        action: () => {
                            try {
                                this.tempPerson = this.personsTable.content[this.personsTable.tempIndex];
                                const bday = this.tempPerson.birthday;
                                this.tempPerson.birthdayFormatted = new Date(
                                    parseInt(bday.substring(6, 10)),
                                    parseInt(bday.substring(3, 5)) - 1,
                                    parseInt(bday.substring(0, 2)));
                                if (
                                    this.selectedPosition !== undefined && 
                                    this.selectedPosition !== null && 
                                    this.selectedPosition.min_age !== undefined && 
                                    this.selectedPosition.max_age !== undefined) {
                                    if (isFinite(this.getPersonAge(this.tempPerson)) && isFinite(this.selectedPosition.min_age) && isFinite(this.selectedPosition.max_age)) {
                                        if (!this.isAgeCompatible(this.tempPerson, this.selectedPosition)) {
                                            this.showIncompatibleAgeModal(modal);
                                            return;
                                        }
                                    }
                                }
                                modal.closeModal();
                                this.changeCurrentPerson();
                            } catch (err) {
                                modal.closeModal();
                            }
                        }
                    }, {
                        role: "button__cancel",
                        content: "Отмена"
                    }
                ]);
            modal.showModal();
        } catch (err) {
            let errorModal = new Modal(
                "errorModal11",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }
    }

    /**
     * Отобразить модальное окно Должность
     */
    showPositionsModal() {
        try {
            let modal = new Modal(
                "positionsModal",
                "Выбор должности",
                this.positionsTable.getTable(),
                [
                    {
                        content: "OK",
                        role: "button__OK",
                        action: () => {
                            try {

                                this.tempPosition = this.positionsTable.content[this.positionsTable.tempIndex];
                                if (
                                    this.selectedPerson !== undefined && 
                                    this.selectedPerson !== null && 
                                    this.tempPosition.min_age !== undefined && 
                                    this.tempPosition.max_age !== undefined) {
                                    if (isFinite(this.getPersonAge(this.selectedPerson)) && isFinite(this.tempPosition.min_age) && isFinite(this.tempPosition.max_age)) {
                                        if (!this.isAgeCompatible(this.selectedPerson, this.tempPosition)) {
                                            this.showIncompatibleAgeModal(modal);
                                            return;
                                        }
                                    }
                                }
                                modal.closeModal();
                                this.changeCurrentPosition();
                            } catch (err) {
                                modal.closeModal();
                            }
                        }
                    }, {
                        role: "button__cancel",
                        content: "Отмена"
                    }
                ]);
            modal.showModal();
        } catch (err) {
            let errorModal = new Modal(
                "errorModal12",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }
    }

    /**
     * Отобразить модальное окно Организация
     */
    showOrgsModal() {
        try {
            let modal = new Modal(
                "orgsModal",
                "Выбор организации",
                this.orgsTable.getTable(),
                [
                    {
                        content: "OK",
                        role: "button__OK",
                        action: () => {
                            try {
                                modal.closeModal();
                                this.changeCurrentOrg();
                            } catch (err) {
                                modal.closeModal();
                            }
                        }
                    }, {
                        role: "button__cancel",
                        content: "Отмена"
                    }
                ]);
            modal.showModal();
        } catch (err) {
            let errorModal = new Modal(
                "errorModal13",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }
    }

    /**
     * Отобразить модальное окно Подразделение
     */
    showSubsModal() {
        try {
            let modal = new Modal(
                "subsModal",
                "Выбор подразделения",
                this.subsTable.getTable(),
                [
                    {
                        content: "OK",
                        role: "button__OK",
                        action: () => {
                            try {
                                modal.closeModal();
                                this.changeCurrentSub();
                            } catch (err) {
                                modal.closeModal();
                            }
                        }
                    }, {
                        role: "button__cancel",
                        content: "Отмена"
                    }
                ]);
            modal.showModal();
        } catch (err) {
            let errorModal = new Modal(
                "errorModal14",
                "Ошибка",
                document.createTextNode("Не удалось загрузить данные."),
                [{ role: "button__cancel", content: "OK" }]);
            errorModal.showModal();
        }
    }

    /**
     * Модальное окно Подтверждение, в случае несоответствия возраста сотрудника занимаемой должности
     * @param {Modal} parentModal Модальное окно, откуда было вызвано данное окно подтверждения
     */
    showIncompatibleAgeModal(parentModal) {
        let source = parentModal.id;
        let message;
        if (source === "personsModal") {
            message = "Выбранный сотрудник не подходит по возрасту. Вы уверены, что хотите выбрать этого сотрудника?";
        } else {
            message = "Выбранная должность не подходит по возрасту сотруднику. Вы уверены, что хотите выбрать эту должность?";
        }
        let modal = new Modal(
            "incompatibleAgeModal",
            "Подтверждение",
            document.createTextNode(message),
            [
                {
                    role: "button__OK",
                    content: "Да",
                    action: () => {
                        if (source === "personsModal") {
                            this.changeCurrentPerson()
                        } else {
                            this.changeCurrentPosition()
                        }
                        modal.closeModal(true);
                    }
                }, {
                    role: "button__cancel",
                    content: "Нет"
                }
            ],
            parentModal);
        modal.showModal();
    }

    /**
     * Вычисляет возраст у сотрудника
     * @param {Object} person Сотрудник, у которого надо вычислить возраст
     * @returns Возраст сотрудника в годах
     */
    getPersonAge(person) {
        if (!person || !person.birthdayFormatted) {
            return null;
        }
        let age = Math.abs(this.now - person.birthdayFormatted);
        return age / 1000 / 60 / 60 / 24 / 365.25;
    }

    /**
     * Проверяет, соответствует ли возраст данного сотрудника допустимому промежутку возрастов из заданной должности.
     * @param {*} person Сотрудник
     * @param {*} position Должность
     * @returns true, если находится внутри интервала. false, если за пределами интервала.
     */
    isAgeCompatible(person, position) {
        try {
            if (isFinite(this.getPersonAge(person)) && isFinite(position.min_age) && isFinite(position.max_age)) {
                if (this.getPersonAge(person) < position.min_age || this.getPersonAge(person) > position.max_age) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        } catch (err) {
            return;
        }
    }

    /**
     * Сохранить выбранного сотрудника.
     */
    changeCurrentPerson() {
        this.personsTable.selectedItemIndex = this.personsTable.tempIndex;
        this.selectedPerson = this.tempPerson;
        $(".currentPerson").html(
            `<div class="col-lg">${this.selectedPerson.lastname} ${this.selectedPerson.middlename} ${this.selectedPerson.firstname}</div>`);
        $(".currentPerson").append(`<div class="col-lg"><button class="removeCurrentPerson">×</button></div>`);
        $(".removeCurrentPerson").one("click", () => { this.removeCurrentPerson(); });
    }

    /**
     * Сохранить выбранную должность.
     */
    changeCurrentPosition() {
        this.positionsTable.selectedItemIndex = this.positionsTable.tempIndex;
        this.selectedPosition = this.tempPosition;
        $(".currentPosition").html(`<div class="col-lg">${this.selectedPosition.name}</div>`);
        $(".currentPosition").append(`<div class="col-lg"><button class="removeCurrentPosition">×</button></div>`);
        $(".removeCurrentPosition").one("click", () => { this.removeCurrentPosition(); });
    }

    /**
     * Сохранить выбранную организацию.
     */
    changeCurrentOrg() {
        this.orgsTable.selectedItemIndex = this.orgsTable.tempIndex;
        this.selectedOrg = this.orgsTable.content[this.orgsTable.selectedItemIndex];
        $(".currentOrg").html(`<div class="col-lg">${this.selectedOrg.name}</div>`);
        $(".currentOrg").append(`<div class="col-lg"><button class="removeCurrentOrg">×</button></div>`);
        $(".removeCurrentOrg").one("click", () => { this.removeCurrentOrg(); });
    }

    /**
     * Сохранить выбранное подразделение.
     */
    changeCurrentSub() {
        this.subsTable.selectedItemIndex = this.subsTable.tempIndex;
        this.selectedSub = this.subsTable.content[this.subsTable.selectedItemIndex];
        $(".currentSub").html(`<div class="col-lg">${this.selectedSub.name}</div>`);
        $(".currentSub").append(`<div class="col-lg"><button class="removeCurrentSub">×</button></div>`);
        $(".removeCurrentSub").one("click", () => { this.removeCurrentSub(); });
    }

    /**
     * Сбросить значение выбранного сотрудника.
     */
    removeCurrentPerson() {
        this.selectedPerson = null;
        this.personsTable.selectedItemIndex = null;
        $(".currentPerson").html("");
    }

    /**
     * Сбросить значение выбранной должности.
     */
    removeCurrentPosition() {
        this.selectedPosition = null;
        this.positionsTable.selectedItemIndex = null;
        $(".currentPosition").html("");
    }

    /**
     * Сбросить значение выбранной организации.
     */
    removeCurrentOrg() {
        this.selectedOrg = null;
        this.orgsTable.selectedItemIndex = null;
        $(".currentOrg").html("");
    }

    /**
     * Сбросить значение выбранного подразделения.
     */
    removeCurrentSub() {
        this.selectedSub = null;
        this.subsTable.selectedItemIndex = null;
        $(".currentSub").html("");
    }
}

/**
 * Таблица с данными.
 */
class Table {
    /**
     * Создание и отображение таблицы
     * @param {Array} columns Столбцы таблицы. Задаются в виде массива объектов со свойствами:
     * name - Название свойства объекта, соответствующее данному столбцу.
     * displayName - Заголовок столбца.
     * @param {Array} content Массив объектов с данными.
     */
    constructor(columns, content) {
        this.columns = columns;
        this.content = content;

        this.table = this.getTable();

        this.tempIndex;
        this.tempPerson;
        this.tempPosition;
    }

    /**
     * Построить DOM-элемент с таблицей и добавить возможность выбирать элемент в таблице.
     * @returns DOM-элемент с таблицей.
     */
    getTable() {
        this.tempIndex = null;
        this.tempPerson = null;
        this.tempPosition = null;

        let table = document.createElement("table");
        table.className = "table-list";
        let tableHead = document.createElement("tr");

        this.columns.forEach(element => {
            let headerCell = document.createElement("th");
            headerCell.innerHTML = element.displayName;
            tableHead.appendChild(headerCell);
        });

        table.appendChild(tableHead);

        this.content.forEach((element, index) => {
            let row = document.createElement("tr");
            if (index === this.selectedItemIndex) {
                row.className = "highlight";
            }
            this.columns.forEach(col => {
                let cell = document.createElement("td");
                cell.innerHTML = element[col.name];
                row.appendChild(cell);
            });

            row.addEventListener("click", (event) => {
                if (isFinite(this.selectedItemIndex)) {
                    table.children[this.selectedItemIndex + 1].className = "";
                }
                if (isFinite(this.tempIndex)) {
                    table.children[this.tempIndex + 1].className = "";
                }
                let selectedRow;
                if (event.target.closest !== undefined) {
                    selectedRow = event.target.closest('tr');
                }
                selectedRow.className = "highlight";

                this.tempIndex = selectedRow.rowIndex - 1;
            });

            table.appendChild(row);
        });

        return table;
    }
}

/**
 * Модальное окно.
 */
class Modal {
    /**
     * 
     * @param {string} id Уникальный идентификатор модального окна. Добавляется как id у DOM-элемента окна.
     * @param {string} title Текст заголовка модального окна.
     * @param {Node} content DOM-элемент с содержимым окна.
     * @param {Array} buttons Кнопки. Задаются как массив объектов со свойствами: 
     *  role - роль. Добавляет класс в DOM-элемент кнопки. Этот класс может определять стандартное поведение.
     *  content - текстовое содержимое кнопки.
     *  action - функция, выполняемая при нажатии на кнопку.
     * @param {Modal} parentModal Родительское модальное окно. 
     */
    constructor(id, title, content, buttons, parentModal) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.buttons = buttons;
        this.parentModal = parentModal;
    }

    /**
     * Отобразить модальное окно и назначить обработчики для стандартных кнопок окна.
     */
    showModal() {
        $("button, a").each(function () {
            $(this)[0].tabIndex -= 1;
        });

        let modalBackground = document.createElement("div");
        modalBackground.className = "modal-background";

        let modalContainer = document.createElement("div");
        modalContainer.className = "modal-container";
        modalContainer.id = this.id;

        let modalHeader = document.createElement("div");
        modalHeader.className = "modal-header";
        modalHeader.innerHTML = `<h1>${this.title}</h1>`;

        let modalCloseButton = document.createElement("button");
        modalCloseButton.className = "modal-header__close";
        modalCloseButton.innerHTML = "×";

        let modalContent = document.createElement("div");
        modalContent.className = "modal-content";
        modalContent.appendChild(this.content);

        let modalButtons = document.createElement("div");
        modalButtons.className = "modal-buttons";

        this.buttons.forEach(button => {
            let newButton = document.createElement("button");
            if (button.role !== null && button.role !== undefined) {
                newButton.className = button.role;
            }
            if (button.content !== null && button.content !== undefined) {
                newButton.innerHTML = button.content;
            }
            if (button.action !== null && button.action !== undefined) {
                newButton.addEventListener("click", button.action);
            }

            modalButtons.appendChild(newButton);
        });

        modalBackground.appendChild(modalContainer);
        modalContainer.appendChild(modalHeader);
        modalHeader.appendChild(modalCloseButton);
        modalContainer.appendChild(modalContent);
        modalContainer.appendChild(modalButtons);

        $("body").append(modalBackground);

        this.addEvents();
    }

    /**
     * Добавить обработчики для стандартных кнопок окна.
     */
    addEvents() {
        $("#" + this.id).find(".modal-header__close, .button__cancel").one("click", () => {
            this.closeModal();
        });

    }

    /**
     * Закрыть окно
     * @param {boolean} closeParent Если true, то закрыть и родительское окно.
     */
    closeModal(closeParent) {
        if (this.parentModal !== undefined && this.parentModal.closeModal !== undefined && closeParent === true) {
            this.parentModal.closeModal();
        }
        $("#" + this.id).parent().remove();
        $("#" + this.id).remove();
        $("button, a").each(function () {
            $(this)[0].tabIndex += 1;
        });
    }
}

/**
 * Вспомогательная функция для сравнения ФИО. Используется для сортировки таблицы сотрудников.
 * @param {*} a Сотрудник a.
 * @param {*} b Сотрудник b.
 * @returns 
 */
function ComparePersons(a, b) {
    if (a.lastname > b.lastname) {
        return 1;
    }
    if (a.lastname < b.lastname) {
        return -1;
    }
    if (a.lastname === b.lastname) {
        if (a.middlename > b.middlename) {
            return 1;
        }
        if (a.middlename < b.middlename) {
            return -1;
        }
        if (a.middlename === b.middlename) {
            if (a.firstname > b.firstname) {
                return 1;
            }
            if (a.firstname < b.firstname) {
                return -1;
            } else {
                return 0;
            }
        }
    }
}

/**
 * Вспомогательная функция для сравнения названий. Используется в остальных таблицах.
 * @param {*} a Название a.
 * @param {*} b Название b.
 * @returns 
 */
function CompareNames(a, b) {
    if (a.name > b.name) {
        return 1;
    }
    if (a.name < b.name) {
        return -1;
    }
    if (a.name === b.name) {
        return 0;
    }
}

// IE Polyfills
(function (ELEMENT) {
    ELEMENT.matches = ELEMENT.matches || ELEMENT.mozMatchesSelector || ELEMENT.msMatchesSelector || ELEMENT.oMatchesSelector || ELEMENT.webkitMatchesSelector;
    ELEMENT.closest = ELEMENT.closest || function closest(selector) {
        if (!this) return null;
        if (this.matches(selector)) return this;
        if (!this.parentElement) { return null }
        else return this.parentElement.closest(selector)
    };
}(Element.prototype));

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },
        configurable: true,
        writable: true
    });
}