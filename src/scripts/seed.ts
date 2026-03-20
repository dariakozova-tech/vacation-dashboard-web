import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { employees, vacationRecords } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

// Direct db connection for seed script — avoids server-only guard in src/lib/db/index.ts
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema: { employees, vacationRecords } });

// ── Employee data (mirrors Electron db.js EMPLOYEES array) ───────────────────
const TOV_EMPLOYEES = [
  { fullName: 'Безручко Артем Олегович',               hireDate: '2025-08-11', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Боднар Орест Сергійович',                hireDate: '2025-07-28', isDeel: false, used2024: 0,  used2025: 5,  balanceReset: false },
  { fullName: 'Бондар Тарас Володимирович',             hireDate: '2024-08-01', isDeel: false, used2024: 9,  used2025: 20, balanceReset: false },
  { fullName: 'Волошина Олександра Євгенівна',          hireDate: '2025-07-14', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Гендін Олексій Євгенович',               hireDate: '2023-08-01', isDeel: false, used2024: 23, used2025: 30, balanceReset: false },
  { fullName: 'Дивнич Маргарита Юріївна',               hireDate: '2023-08-01', isDeel: false, used2024: 33, used2025: 27, balanceReset: true  },
  { fullName: 'Єрмохін Максим Олексійович',             hireDate: '2025-05-30', isDeel: false, used2024: 0,  used2025: 21, balanceReset: true  },
  { fullName: 'Жовнуватий Олег Валентинович',           hireDate: '2024-08-01', isDeel: false, used2024: 5,  used2025: 24, balanceReset: false },
  { fullName: 'Кисельов Євген Олександрович',           hireDate: '2025-11-19', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',      hireDate: '2023-08-01', isDeel: false, used2024: 35, used2025: 22, balanceReset: false },
  { fullName: 'Клипальський Михайло Костянтинович',     hireDate: '2023-12-18', isDeel: false, used2024: 18, used2025: 15, balanceReset: false },
  { fullName: 'Коваленко Кирило Сергійович',            hireDate: '2025-08-18', isDeel: false, used2024: 0,  used2025: 14, balanceReset: true  },
  { fullName: "Козова Дар'я Володимирівна",             hireDate: '2025-03-24', isDeel: false, used2024: 0,  used2025: 14, balanceReset: false },
  { fullName: 'Косарєва Єлизавета Максимівна',          hireDate: '2023-08-01', isDeel: false, used2024: 0,  used2025: 40, balanceReset: true  },
  { fullName: 'Куклер Владислав Русланович',            hireDate: '2025-12-15', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Лапін Сергій Миколайович',               hireDate: '2023-12-18', isDeel: false, used2024: 27, used2025: 28, balanceReset: true  },
  { fullName: 'Лісова Соломія Орестівна',               hireDate: '2025-02-07', isDeel: false, used2024: 0,  used2025: 30, balanceReset: true  },
  { fullName: 'Мироненко Ольга Володимирівна',          hireDate: '2025-10-27', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Оніщук Марина Володимирівна',            hireDate: '2025-04-09', isDeel: false, used2024: 0,  used2025: 2,  balanceReset: false },
  { fullName: 'Пирлик Вікторія Андріївна',              hireDate: '2024-03-06', isDeel: false, used2024: 8,  used2025: 22, balanceReset: false },
  { fullName: 'Подорван Ольга Юріївна',                 hireDate: '2024-09-16', isDeel: false, used2024: 0,  used2025: 38, balanceReset: true  },
  { fullName: 'Породько Ярослав Володимирович',         hireDate: '2025-12-02', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Приймаш Дмитро Леонідович',              hireDate: '2024-01-16', isDeel: false, used2024: 11, used2025: 21, balanceReset: false },
  { fullName: 'Прищепа Олександр Миколайович',          hireDate: '2023-12-18', isDeel: false, used2024: 24, used2025: 35, balanceReset: true  },
  { fullName: 'Процик Дмитро Володимирович',            hireDate: '2023-12-18', isDeel: false, used2024: 21, used2025: 8,  balanceReset: false },
  { fullName: 'Реутська Олеся Дмитрівна',               hireDate: '2025-08-01', isDeel: false, used2024: 0,  used2025: 0,  balanceReset: false },
  { fullName: 'Савченко Кирило Олександрович',          hireDate: '2024-01-16', isDeel: false, used2024: 23, used2025: 22, balanceReset: false },
  { fullName: 'Семенюк Олександр Дмитрович',            hireDate: '2023-08-01', isDeel: false, used2024: 13, used2025: 16, balanceReset: false },
  { fullName: 'Сисенко Максим Ігорович',                hireDate: '2023-12-18', isDeel: false, used2024: 31, used2025: 32, balanceReset: true  },
  { fullName: 'Совгир Дмитро Олександрович',            hireDate: '2023-12-18', isDeel: false, used2024: 21, used2025: 12, balanceReset: false },
  { fullName: 'Хоміч Ліна Ігорівна',                    hireDate: '2025-06-16', isDeel: false, used2024: 0,  used2025: 15, balanceReset: false },
  { fullName: 'Целюх Руслана Русланівна',               hireDate: '2025-08-01', isDeel: false, used2024: 0,  used2025: 5,  balanceReset: false },
  { fullName: 'Чередниченко Станіслав Сергійович',      hireDate: '2023-12-18', isDeel: false, used2024: 20, used2025: 14, balanceReset: false },
  { fullName: 'Черненко Олексій Дмитрович',             hireDate: '2023-12-18', isDeel: false, used2024: 3,  used2025: 11, balanceReset: false },
  { fullName: 'Шепета Андрій Сергійович',               hireDate: '2024-08-01', isDeel: false, used2024: 8,  used2025: 22, balanceReset: false },
  { fullName: 'Шиферсон Антон Романович',               hireDate: '2023-12-18', isDeel: false, used2024: 12, used2025: 17, balanceReset: false },
];

const DEEL_CONTRACTORS = [
  { fullName: 'Demetre Dokhnadze',   hireDate: '2023-08-01', isDeel: true, used2024: 12, used2025: 14, balanceReset: false },
  { fullName: 'Temo Tchanukvadze',   hireDate: '2023-08-01', isDeel: true, used2024: 20, used2025: 21, balanceReset: false },
  { fullName: 'Mikheili Maisuradze', hireDate: '2023-08-01', isDeel: true, used2024: 30, used2025: 16, balanceReset: false },
  { fullName: 'Nikolozi Gabunia',    hireDate: '2024-07-25', isDeel: true, used2024: 10, used2025: 12, balanceReset: false },
  { fullName: 'Kate Sedykh',         hireDate: '2023-08-01', isDeel: true, used2024: 29, used2025: 29, balanceReset: false },
  { fullName: 'Oksana Hromova',      hireDate: '2025-06-18', isDeel: true, used2024: 0,  used2025: 2,  balanceReset: false },
];

// ── Email map (mirrors Electron db.js EMAIL_MAP) ──────────────────────────────
const EMAIL_MAP: Record<string, string> = {
  'Оніщук Марина Володимирівна':        'marina.onischuk@techery.io',
  'Гендін Олексій Євгенович':            'alex.hendin@techery.io',
  'Семенюк Олександр Дмитрович':         'alex.semeniuk@techery.io',
  'Косарєва Єлизавета Максимівна':       'lisa.kosareva@techery.io',
  'Клеймьонова Анастасія Геннадіївна':   'anastasiia.kleimonova@techery.io',
  'Подорван Ольга Юріївна':              'olha.podorvan@techery.io',
  'Дивнич Маргарита Юріївна':            'rita.dyvnych@techery.io',
  'Сисенко Максим Ігорович':             'max.s@techery.io',
  'Шиферсон Антон Романович':            'anton.shiferson@techery.io',
  'Совгир Дмитро Олександрович':         'dmitry.s@techery.io',
  'Прищепа Олександр Миколайович':       'alex.pryschepa@techery.io',
  'Чередниченко Станіслав Сергійович':   'stas.cherednichenko@techery.io',
  'Процик Дмитро Володимирович':         'dmytry.protsyk@techery.io',
  'Черненко Олексій Дмитрович':          'alex.chernenko@techery.io',
  'Клипальський Михайло Костянтинович':  'michael.klypalsky@techery.io',
  'Лапін Сергій Миколайович':            'serge.lapin@techery.io',
  'Савченко Кирило Олександрович':       'kyrylo.savchenko@techery.io',
  'Приймаш Дмитро Леонідович':           'dmytro.pryimash@techery.io',
  'Пирлик Вікторія Андріївна':           'victoria.pyrlyk@techery.io',
  'Жовнуватий Олег Валентинович':        'oleh.zhovnuvatyi@techery.io',
  'Бондар Тарас Володимирович':          'taras.bondar@techery.io',
  'Шепета Андрій Сергійович':            'andrew.shepeta@techery.io',
  'Лісова Соломія Орестівна':            'solomiia.lisova@techery.io',
  "Козова Дар'я Володимирівна":          'daria.kozova@techery.io',
  'Хоміч Ліна Ігорівна':                 'lina.khomich@techery.io',
  'Єрмохін Максим Олексійович':          'max.yermokhin@techery.io',
  'Волошина Олександра Євгенівна':       'oleksandra.voloshyna@techery.io',
  'Реутська Олеся Дмитрівна':            'olesia.reutska@techery.io',
  'Целюх Руслана Русланівна':            'ruslana.tseliukh@techery.io',
  'Боднар Орест Сергійович':             'orest.bodnar@techery.io',
  'Безручко Артем Олегович':             'artem.bezruchko@techery.io',
  'Коваленко Кирило Сергійович':         'kyrylo.kovalenko@techery.io',
  'Мироненко Ольга Володимирівна':       'olga.myronenko@techery.io',
  'Кисельов Євген Олександрович':        'yevhen.kyselov@techery.io',
  'Породько Ярослав Володимирович':      'yaroslav.porodko@gmail.com',
  'Куклер Владислав Русланович':         'vladyslav.kukler@techery.io',
  'Demetre Dokhnadze':                   'demetre.dokhnadze@techery.io',
  'Temo Tchanukvadze':                   'temo.tchanukvadze@techery.io',
  'Mikheili Maisuradze':                 'mikheili.maisuradze@techery.io',
  'Nikolozi Gabunia':                    'nikoloz.gabunia@techery.io',
  'Kate Sedykh':                         'kate.sedykh@techery.io',
  'Oksana Hromova':                      'oksana.gromova@techery.io',
};

// ── Archive periods (mirrors Electron db.js ARCHIVE_PERIODS) ─────────────────
// Only records for employees in the ALLOWED_EMPLOYEES set are included.
const ARCHIVE_PERIODS: Array<{ fullName: string; start: string; end: string; days: number }> = [
  // 2025
  { fullName: 'Шепета Андрій Сергійович',            start: '2025-01-27', end: '2025-01-31', days: 5  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2025-01-27', end: '2025-02-03', days: 8  },
  { fullName: 'Подорван Ольга Юріївна',               start: '2025-02-08', end: '2025-02-13', days: 6  },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2025-03-03', end: '2025-03-09', days: 7  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2025-02-10', end: '2025-02-11', days: 2  },
  { fullName: 'Савченко Кирило Олександрович',        start: '2025-02-21', end: '2025-02-23', days: 3  },
  { fullName: 'Процик Дмитро Володимирович',          start: '2025-02-24', end: '2025-03-02', days: 7  },
  { fullName: 'Гендін Олексій Євгенович',             start: '2025-03-01', end: '2025-03-10', days: 10 },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-02-24', end: '2025-02-24', days: 1  },
  { fullName: 'Савченко Кирило Олександрович',        start: '2025-03-14', end: '2025-03-17', days: 4  },
  { fullName: 'Бондар Тарас Володимирович',           start: '2025-03-13', end: '2025-03-18', days: 6  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2025-03-14', end: '2025-03-17', days: 4  },
  { fullName: 'Прищепа Олександр Миколайович',        start: '2025-03-15', end: '2025-03-19', days: 5  },
  { fullName: 'Шепета Андрій Сергійович',             start: '2025-03-21', end: '2025-03-21', days: 1  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-04-11', end: '2025-04-11', days: 1  },
  { fullName: 'Семенюк Олександр Дмитрович',          start: '2025-04-16', end: '2025-04-18', days: 3  },
  { fullName: 'Жовнуватий Олег Валентинович',         start: '2025-04-07', end: '2025-04-08', days: 2  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2025-06-26', end: '2025-07-08', days: 13 },
  { fullName: 'Прищепа Олександр Миколайович',        start: '2025-05-03', end: '2025-05-11', days: 9  },
  { fullName: 'Приймаш Дмитро Леонідович',            start: '2025-05-12', end: '2025-05-18', days: 7  },
  { fullName: 'Жовнуватий Олег Валентинович',         start: '2025-04-28', end: '2025-05-04', days: 7  },
  { fullName: 'Совгир Дмитро Олександрович',          start: '2025-05-02', end: '2025-05-02', days: 1  },
  { fullName: 'Савченко Кирило Олександрович',        start: '2025-05-05', end: '2025-05-05', days: 1  },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2025-05-16', end: '2025-05-30', days: 5  },
  { fullName: 'Лісова Соломія Орестівна',             start: '2025-06-07', end: '2025-06-17', days: 11 },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2025-05-26', end: '2025-06-01', days: 7  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2025-06-19', end: '2025-06-20', days: 2  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2025-06-09', end: '2025-06-09', days: 1  },
  { fullName: 'Совгир Дмитро Олександрович',          start: '2025-07-07', end: '2025-07-13', days: 7  },
  { fullName: 'Жовнуватий Олег Валентинович',         start: '2025-06-30', end: '2025-07-06', days: 7  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-02-01', end: '2025-02-09', days: 9  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-07-14', end: '2025-07-16', days: 3  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-07-17', end: '2025-07-20', days: 4  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-11-14', end: '2025-12-03', days: 20 },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2025-12-04', end: '2025-12-05', days: 2  },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2025-06-26', end: '2025-06-26', days: 1  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2025-07-20', end: '2025-07-30', days: 9  },
  { fullName: 'Лапін Сергій Миколайович',             start: '2025-07-07', end: '2025-07-13', days: 7  },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2025-07-03', end: '2025-07-04', days: 2  },
  { fullName: "Козова Дар'я Володимирівна",           start: '2025-07-28', end: '2025-08-08', days: 12 },
  { fullName: 'Оніщук Марина Володимирівна',          start: '2025-07-04', end: '2025-07-04', days: 1  },
  { fullName: 'Семенюк Олександр Дмитрович',          start: '2025-07-04', end: '2025-07-04', days: 1  },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2025-08-25', end: '2025-08-25', days: 1  },
  { fullName: 'Савченко Кирило Олександрович',        start: '2025-09-08', end: '2025-09-21', days: 14 },
  { fullName: 'Сисенко Максим Ігорович',              start: '2025-08-18', end: '2025-08-22', days: 5  },
  { fullName: 'Подорван Ольга Юріївна',               start: '2025-07-28', end: '2025-08-10', days: 14 },
  { fullName: 'Бондар Тарас Володимирович',           start: '2025-08-04', end: '2025-08-12', days: 9  },
  { fullName: 'Гендін Олексій Євгенович',             start: '2025-07-24', end: '2025-08-05', days: 13 },
  { fullName: 'Совгир Дмитро Олександрович',          start: '2025-08-01', end: '2025-08-01', days: 1  },
  { fullName: 'Прищепа Олександр Миколайович',        start: '2025-09-04', end: '2025-09-17', days: 14 },
  { fullName: 'Черненко Олексій Дмитрович',           start: '2025-08-25', end: '2025-08-31', days: 7  },
  { fullName: 'Жовнуватий Олег Валентинович',         start: '2025-09-01', end: '2025-09-07', days: 7  },
  { fullName: 'Шепета Андрій Сергійович',             start: '2025-08-15', end: '2025-08-15', days: 1  },
  { fullName: 'Шепета Андрій Сергійович',             start: '2025-08-22', end: '2025-08-22', days: 1  },
  { fullName: 'Лапін Сергій Миколайович',             start: '2025-08-14', end: '2025-08-14', days: 1  },
  { fullName: 'Шиферсон Антон Романович',             start: '2025-08-12', end: '2025-08-12', days: 1  },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2025-09-01', end: '2025-09-07', days: 7  },
  { fullName: 'Лісова Соломія Орестівна',             start: '2025-08-25', end: '2025-08-25', days: 1  },
  { fullName: 'Лісова Соломія Орестівна',             start: '2025-09-05', end: '2025-09-14', days: 10 },
  { fullName: 'Приймаш Дмитро Леонідович',            start: '2025-09-15', end: '2025-09-28', days: 14 },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2025-08-25', end: '2025-08-25', days: 1  },
  { fullName: 'Подорван Ольга Юріївна',               start: '2025-09-02', end: '2025-09-03', days: 2  },
  { fullName: 'Лапін Сергій Миколайович',             start: '2025-09-01', end: '2025-09-01', days: 1  },
  { fullName: 'Семенюк Олександр Дмитрович',          start: '2025-09-22', end: '2025-09-28', days: 7  },
  { fullName: 'Семенюк Олександр Дмитрович',          start: '2025-09-29', end: '2025-10-03', days: 5  },
  { fullName: 'Єрмохін Максим Олексійович',           start: '2025-09-05', end: '2025-09-14', days: 10 },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2025-09-22', end: '2025-09-28', days: 7  },
  { fullName: 'Хоміч Ліна Ігорівна',                  start: '2025-10-08', end: '2025-10-22', days: 15 },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2025-09-25', end: '2025-09-26', days: 2  },
  { fullName: 'Подорван Ольга Юріївна',               start: '2025-10-09', end: '2025-10-10', days: 2  },
  { fullName: 'Лапін Сергій Миколайович',             start: '2025-10-25', end: '2025-11-02', days: 1  },
  { fullName: 'Черненко Олексій Дмитрович',           start: '2025-10-23', end: '2025-10-26', days: 4  },
  { fullName: 'Єрмохін Максим Олексійович',           start: '2025-10-21', end: '2025-10-23', days: 2  },
  { fullName: 'Шиферсон Антон Романович',             start: '2025-10-23', end: '2025-10-24', days: 2  },
  { fullName: 'Оніщук Марина Володимирівна',          start: '2025-11-13', end: '2025-11-14', days: 2  },
  { fullName: 'Оніщук Марина Володимирівна',          start: '2025-12-08', end: '2025-12-22', days: 15 },
  { fullName: 'Бондар Тарас Володимирович',           start: '2025-11-03', end: '2025-11-07', days: 5  },
  { fullName: "Козова Дар'я Володимирівна",           start: '2025-11-04', end: '2025-11-05', days: 2  },
  { fullName: 'Процик Дмитро Володимирович',          start: '2025-11-07', end: '2025-11-07', days: 1  },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2025-11-17', end: '2025-11-28', days: 12 },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2025-11-17', end: '2025-11-17', days: 1  },
  { fullName: 'Подорван Ольга Юріївна',               start: '2025-12-09', end: '2025-12-22', days: 14 },
  { fullName: 'Лісова Соломія Орестівна',             start: '2025-11-24', end: '2025-12-01', days: 8  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2025-11-24', end: '2025-11-30', days: 7  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2025-12-22', end: '2025-12-27', days: 6  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2025-12-28', end: '2026-01-04', days: 8  },
  { fullName: 'Боднар Орест Сергійович',              start: '2025-12-15', end: '2025-12-19', days: 5  },
  { fullName: 'Шепета Андрій Сергійович',             start: '2025-12-01', end: '2025-12-10', days: 10 },
  { fullName: 'Шиферсон Антон Романович',             start: '2025-11-24', end: '2025-12-07', days: 14 },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2025-12-01', end: '2025-12-02', days: 2  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2025-12-29', end: '2026-01-07', days: 10 },
  { fullName: 'Жовнуватий Олег Валентинович',         start: '2025-12-01', end: '2025-12-01', days: 1  },
  { fullName: 'Совгир Дмитро Олександрович',          start: '2025-12-01', end: '2025-12-03', days: 3  },
  { fullName: 'Целюх Руслана Русланівна',             start: '2025-12-15', end: '2025-12-19', days: 5  },
  { fullName: 'Коваленко Кирило Сергійович',          start: '2025-12-22', end: '2026-01-04', days: 14 },
  { fullName: 'Лапін Сергій Миколайович',             start: '2025-12-22', end: '2025-12-31', days: 10 },
  { fullName: 'Гендін Олексій Євгенович',             start: '2025-12-08', end: '2025-12-14', days: 7  },
  { fullName: 'Єрмохін Максим Олексійович',           start: '2025-12-29', end: '2026-01-06', days: 9  },
  { fullName: 'Прищепа Олександр Миколайович',        start: '2025-12-22', end: '2025-12-28', days: 7  },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2026-01-01', end: '2026-01-04', days: 4  },
  { fullName: 'Процик Дмитро Володимирович',          start: '2026-01-01', end: '2026-01-21', days: 21 },

  // 2024
  { fullName: 'Процик Дмитро Володимирович',          start: '2024-12-23', end: '2024-12-29', days: 7  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2024-12-27', end: '2025-01-06', days: 11 },
  { fullName: 'Лапін Сергій Миколайович',             start: '2024-12-02', end: '2024-12-15', days: 14 },
  { fullName: 'Лапін Сергій Миколайович',             start: '2024-11-12', end: '2024-11-12', days: 1  },
  { fullName: 'Прищепа Олександр Миколайович',        start: '2024-12-23', end: '2024-12-31', days: 9  },
  { fullName: 'Жовнуватий Олег Валентинович',         start: '2024-12-02', end: '2024-12-06', days: 5  },
  { fullName: 'Шепета Андрій Сергійович',             start: '2024-12-09', end: '2024-12-16', days: 8  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2024-11-20', end: '2024-11-22', days: 3  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2024-12-20', end: '2025-01-02', days: 14 },
  { fullName: 'Процик Дмитро Володимирович',          start: '2024-11-07', end: '2024-11-10', days: 4  },
  { fullName: 'Совгир Дмитро Олександрович',          start: '2024-12-14', end: '2024-12-29', days: 16 },
  { fullName: 'Бондар Тарас Володимирович',           start: '2024-10-29', end: '2024-11-06', days: 9  },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2024-10-21', end: '2024-10-25', days: 5  },
  { fullName: 'Савченко Кирило Олександрович',        start: '2024-10-17', end: '2024-10-21', days: 5  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2024-11-02', end: '2024-11-13', days: 12 },
  { fullName: 'Семенюк Олександр Дмитрович',          start: '2024-10-28', end: '2024-11-01', days: 5  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2024-09-30', end: '2024-10-01', days: 3  },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2024-11-18', end: '2024-11-24', days: 7  },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2024-10-21', end: '2024-10-27', days: 7  },
  { fullName: 'Приймаш Дмитро Леонідович',            start: '2024-10-11', end: '2024-10-21', days: 11 },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2024-10-14', end: '2024-10-27', days: 14 },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2024-09-16', end: '2024-09-17', days: 2  },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2024-09-17', end: '2024-09-17', days: 1  },
  { fullName: 'Гендін Олексій Євгенович',             start: '2024-09-02', end: '2024-09-13', days: 12 },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2024-08-21', end: '2024-08-21', days: 1  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2024-06-17', end: '2024-06-30', days: 14 },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2024-07-29', end: '2024-08-02', days: 5  },
  { fullName: 'Савченко Кирило Олександрович',        start: '2024-09-09', end: '2024-09-20', days: 12 },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2024-07-22', end: '2024-07-26', days: 5  },
  { fullName: 'Процик Дмитро Володимирович',          start: '2024-06-24', end: '2024-06-28', days: 5  },
  { fullName: 'Совгир Дмитро Олександрович',          start: '2024-06-17', end: '2024-06-21', days: 5  },
  { fullName: 'Шиферсон Антон Романович',             start: '2024-04-01', end: '2024-04-12', days: 12 },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2024-05-15', end: '2024-05-22', days: 8  },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2024-05-16', end: '2024-05-24', days: 9  },
  { fullName: 'Процик Дмитро Володимирович',          start: '2024-05-06', end: '2024-05-06', days: 1  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2024-06-24', end: '2024-07-05', days: 12 },
  { fullName: 'Семенюк Олександр Дмитрович',          start: '2024-05-01', end: '2024-05-03', days: 3  },
  { fullName: 'Гендін Олексій Євгенович',             start: '2024-04-11', end: '2024-04-11', days: 1  },
  { fullName: 'Лапін Сергій Миколайович',             start: '2024-04-23', end: '2024-05-03', days: 11 },
  { fullName: 'Савченко Кирило Олександрович',        start: '2024-05-03', end: '2024-05-08', days: 6  },
  { fullName: 'Чередниченко Станіслав Сергійович',    start: '2024-04-15', end: '2024-04-19', days: 5  },
  { fullName: 'Прищепа Олександр Миколайович',        start: '2024-04-18', end: '2024-05-01', days: 14 },
  { fullName: 'Гендін Олексій Євгенович',             start: '2024-02-05', end: '2024-02-14', days: 10 },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2024-02-02', end: '2024-02-09', days: 8  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2024-01-22', end: '2024-02-02', days: 12 },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2024-02-21', end: '2024-02-23', days: 3  },
  { fullName: 'Процик Дмитро Володимирович',          start: '2024-02-23', end: '2024-02-26', days: 4  },
  { fullName: 'Клипальський Михайло Костянтинович',   start: '2024-03-11', end: '2024-03-13', days: 3  },
  { fullName: 'Сисенко Максим Ігорович',              start: '2024-03-11', end: '2024-03-15', days: 5  },
  { fullName: 'Дивнич Маргарита Юріївна',             start: '2024-08-09', end: '2024-08-09', days: 1  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2024-08-15', end: '2024-08-16', days: 2  },
  { fullName: 'Клеймьонова Анастасія Геннадіївна',   start: '2024-08-26', end: '2024-08-26', days: 1  },
  { fullName: 'Косарєва Єлизавета Максимівна',        start: '2024-11-15', end: '2024-11-15', days: 1  },
  { fullName: 'Пирлик Вікторія Андріївна',            start: '2024-07-29', end: '2024-07-29', days: 1  },
  { fullName: 'Лапін Сергій Миколайович',             start: '2024-08-16', end: '2024-08-16', days: 1  },
];

// ── 2026 vacation periods ─────────────────────────────────────────────────────
const VACATION_2026: Array<{ fullName: string; start: string; end: string; days: number }> = [
  { fullName: 'Черненко Олексій Дмитрович',         start: '2026-01-12', end: '2026-01-16', days: 5  },
  { fullName: 'Черненко Олексій Дмитрович',         start: '2026-01-17', end: '2026-01-25', days: 9  },
  { fullName: 'Черненко Олексій Дмитрович',         start: '2026-02-01', end: '2026-02-15', days: 15 },
  { fullName: 'Черненко Олексій Дмитрович',         start: '2026-02-16', end: '2026-02-18', days: 3  },
  { fullName: 'Совгир Дмитро Олександрович',        start: '2026-01-26', end: '2026-01-30', days: 5  },
  { fullName: 'Савченко Кирило Олександрович',      start: '2026-02-16', end: '2026-02-19', days: 4  },
  { fullName: 'Савченко Кирило Олександрович',      start: '2026-02-20', end: '2026-02-20', days: 1  },
  { fullName: 'Клипальський Михайло Костянтинович', start: '2026-01-21', end: '2026-01-21', days: 1  },
  { fullName: 'Клипальський Михайло Костянтинович', start: '2026-03-02', end: '2026-03-05', days: 4  },
  { fullName: 'Безручко Артем Олегович',            start: '2026-02-09', end: '2026-02-13', days: 4  },
  { fullName: 'Волошина Олександра Євгенівна',      start: '2026-02-16', end: '2026-02-20', days: 5  },
  { fullName: 'Хоміч Ліна Ігорівна',                start: '2026-02-23', end: '2026-02-27', days: 5  },
  { fullName: 'Подорван Ольга Юріївна',             start: '2026-03-02', end: '2026-03-02', days: 1  },
  { fullName: 'Мироненко Ольга Володимирівна',      start: '2026-03-02', end: '2026-03-06', days: 5  },
  { fullName: 'Косарєва Єлизавета Максимівна',      start: '2026-02-27', end: '2026-02-27', days: 1  },
  { fullName: 'Косарєва Єлизавета Максимівна',      start: '2026-03-11', end: '2026-03-11', days: 1  },
  { fullName: 'Процик Дмитро Володимирович',        start: '2026-02-23', end: '2026-02-24', days: 2  },
  { fullName: 'Дивнич Маргарита Юріївна',           start: '2026-03-06', end: '2026-03-09', days: 4  },
  { fullName: 'Целюх Руслана Русланівна',           start: '2026-02-26', end: '2026-02-27', days: 2  },
  { fullName: 'Лапін Сергій Миколайович',           start: '2026-03-09', end: '2026-03-09', days: 1  },
  { fullName: 'Боднар Орест Сергійович',            start: '2026-03-16', end: '2026-03-20', days: 5  },
  { fullName: 'Чередниченко Станіслав Сергійович',  start: '2026-01-01', end: '2026-01-04', days: 4  },
  { fullName: 'Семенюк Олександр Дмитрович',        start: '2026-01-07', end: '2026-01-16', days: 10 },
  // Deel 2026 vacations
  { fullName: 'Oksana Hromova',                     start: '2026-01-01', end: '2026-01-09', days: 9  },
  { fullName: 'Oksana Hromova',                     start: '2026-02-13', end: '2026-02-13', days: 1  },
  { fullName: 'Mikheili Maisuradze',                start: '2026-03-02', end: '2026-03-02', days: 1  },
];

async function main() {
  // Idempotency check: skip if already seeded
  const existing = await db.select().from(employees);
  if (existing.length > 0) {
    console.log(`Already seeded (${existing.length} employees found). Skipping.`);
    process.exit(0);
  }

  // Build a map of fullName -> employee id for record insertion
  const employeeMap: Record<string, number> = {};

  // Insert all employees (TOV + Deel)
  const allEmployeeData = [...TOV_EMPLOYEES, ...DEEL_CONTRACTORS];
  const insertedEmployees = await db
    .insert(employees)
    .values(
      allEmployeeData.map((emp) => ({
        fullName: emp.fullName,
        hireDate: emp.hireDate,
        isDeel: emp.isDeel,
        email: EMAIL_MAP[emp.fullName] ?? null,
      }))
    )
    .returning();

  for (const row of insertedEmployees) {
    employeeMap[row.fullName] = row.id;
  }

  // Insert days_sum and balance_reset records for each employee
  const summaryRecords = [];
  for (const emp of allEmployeeData) {
    const employeeId = employeeMap[emp.fullName];
    if (!employeeId) continue;

    if (emp.used2024 > 0) {
      summaryRecords.push({
        employeeId,
        recordType: 'days_sum' as const,
        startDate: null,
        endDate: null,
        daysCount: emp.used2024,
        year: 2024,
        note: 'Архів 2024',
      });
    }
    if (emp.used2025 > 0) {
      summaryRecords.push({
        employeeId,
        recordType: 'days_sum' as const,
        startDate: null,
        endDate: null,
        daysCount: emp.used2025,
        year: 2025,
        note: 'Архів 2025',
      });
    }
    if (emp.balanceReset) {
      summaryRecords.push({
        employeeId,
        recordType: 'balance_reset' as const,
        startDate: null,
        endDate: null,
        daysCount: null,
        year: null,
        note: "Обнулення від'ємного балансу на 01.01.2026",
      });
    }
  }

  if (summaryRecords.length > 0) {
    await db.insert(vacationRecords).values(summaryRecords);
  }

  // Insert archive period records (with deduplication by employee + start + end)
  const seenPeriods = new Set<string>();
  const periodRecords = [];

  for (const period of ARCHIVE_PERIODS) {
    const employeeId = employeeMap[period.fullName];
    if (!employeeId) {
      console.warn(`Warning: employee not found for archive period: ${period.fullName}`);
      continue;
    }
    const key = `${employeeId}|${period.start}|${period.end}`;
    if (seenPeriods.has(key)) continue;
    seenPeriods.add(key);

    const year = parseInt(period.start.slice(0, 4), 10);
    periodRecords.push({
      employeeId,
      recordType: 'period' as const,
      startDate: period.start,
      endDate: period.end,
      daysCount: period.days,
      year,
      note: 'Архів',
    });
  }

  // Insert 2026 vacation periods
  for (const v of VACATION_2026) {
    const employeeId = employeeMap[v.fullName];
    if (!employeeId) {
      console.warn(`Warning: employee not found for 2026 vacation: ${v.fullName}`);
      continue;
    }
    const key = `${employeeId}|${v.start}|${v.end}`;
    if (seenPeriods.has(key)) continue;
    seenPeriods.add(key);

    periodRecords.push({
      employeeId,
      recordType: 'period' as const,
      startDate: v.start,
      endDate: v.end,
      daysCount: v.days,
      year: parseInt(v.start.slice(0, 4), 10),
      note: v.fullName.match(/^[A-Z]/) ? 'Vacation 2026' : 'Відпустка 2026',
    });
  }

  if (periodRecords.length > 0) {
    await db.insert(vacationRecords).values(periodRecords);
  }

  console.log(`Seeded ${insertedEmployees.length} employees, ${summaryRecords.length + periodRecords.length} vacation records`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
