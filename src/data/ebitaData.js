// Исходные данные для экологической карты ГПЗ «Эбита»

// Реестр видов млекопитающих (по списку пользователя)
export const MAMMALS_SPECIES = [
  // Грызуны (Rodentia)
  { id: "mus_musculus", name: "Домовая мышь", latinName: "Mus musculus", category: "Грызуны (Rodentia)", status: "Фоновый вид" },
  { id: "apodemus_agrarius", name: "Полевая мышь", latinName: "Apodemus agrarius", category: "Грызуны (Rodentia)", status: "Фоновый вид" },
  { id: "apodemus_uralensis", name: "Малая лесная мышь", latinName: "Apodemus uralensis", category: "Грызуны (Rodentia)", status: "Фоновый вид" },
  { id: "micromys_minutus", name: "Мышь-малютка", latinName: "Micromys minutus", category: "Грызуны (Rodentia)", status: "Малочисленный вид" },
  { id: "rattus_norvegicus", name: "Серая крыса", latinName: "Rattus norvegicus", category: "Грызуны (Rodentia)", status: "Синантропный вид" },
  { id: "cricetus_cricetus", name: "Обыкновенный хомяк", latinName: "Cricetus cricetus", category: "Грызуны (Rodentia)", status: "Обычный вид" },
  { id: "microtus_arvalis", name: "Обыкновенная полёвка", latinName: "Microtus arvalis", category: "Грызуны (Rodentia)", status: "Многочисленный вид" },
  { id: "microtus_socialis", name: "Общественная полёвка", latinName: "Microtus socialis", category: "Грызуны (Rodentia)", status: "Обычный вид" },
  { id: "microtus_oeconomus", name: "Полёвка-экономка", latinName: "Microtus oeconomus", category: "Грызуны (Rodentia)", status: "Обычный вид" },
  { id: "microtus_gregalis", name: "Узкочерепная полёвка", latinName: "Microtus gregalis", category: "Грызуны (Rodentia)", status: "Обычный вид" },
  { id: "myodes_glareolus", name: "Рыжая полёвка", latinName: "Myodes glareolus", category: "Грызуны (Rodentia)", status: "Обычный вид" },
  { id: "arvicola_amphibius", name: "Водяная полёвка", latinName: "Arvicola amphibius", category: "Грызуны (Rodentia)", status: "Околоводный вид" },
  { id: "ondatra_zibethicus", name: "Ондатра", latinName: "Ondatra zibethicus", category: "Грызуны (Rodentia)", status: "Акклиматизированный вид" },
  { id: "meriones_tamariscinus", name: "Тамарисковая песчанка", latinName: "Meriones tamariscinus", category: "Грызуны (Rodentia)", status: "Степной вид" },
  { id: "meriones_meridianus", name: "Полуденная песчанка", latinName: "Meriones meridianus", category: "Грызуны (Rodentia)", status: "Степной вид" },
  { id: "marmota_bobak", name: "Обыкновенный сурок (Байбак)", latinName: "Marmota bobak", category: "Грызуны (Rodentia)", status: "Охраняемый вид" },
  { id: "spermophilus_fulvus", name: "Жёлтый суслик", latinName: "Spermophilus fulvus", category: "Грызуны (Rodentia)", status: "Обычный вид" },
  { id: "spermophilus_pygmaeus", name: "Малый суслик", latinName: "Spermophilus pygmaeus", category: "Грызуны (Rodentia)", status: "Многочисленный вид" },
  { id: "allactaga_major", name: "Большой тушканчик", latinName: "Allactaga major", category: "Грызуны (Rodentia)", status: "Степной вид" },
  { id: "scarturus_elater", name: "Малый тушканчик", latinName: "Scarturus elater", category: "Грызуны (Rodentia)", status: "Степной вид" },
  { id: "pygeretmus_platyurus", name: "Толстохвостый тушканчик", latinName: "Pygeretmus platyurus", category: "Грызуны (Rodentia)", status: "Редкий вид" },
  { id: "pygeretmus_pumilio", name: "Тарбаганчик", latinName: "Pygeretmus pumilio", category: "Грызуны (Rodentia)", status: "Степной вид" },
  { id: "dipus_sagitta", name: "Мохноногий тушканчик", latinName: "Dipus sagitta", category: "Грызуны (Rodentia)", status: "Песчаный вид" },
  { id: "salpingotus_pallidus", name: "Бледный тушканчик", latinName: "Salpingotus pallidus", category: "Грызуны (Rodentia)", status: "Редкий вид" },
  { id: "allactaga_severtzovi", name: "Тушканчик Северцова", latinName: "Allactaga severtzovi", category: "Грызуны (Rodentia)", status: "Редкий вид" },
  { id: "ellobius_talpinus", name: "Обыкновенная слепушонка", latinName: "Ellobius talpinus", category: "Грызуны (Rodentia)", status: "Подземный вид" },
  { id: "stylodipus_telum", name: "Обыкновенный емуранчик", latinName: "Stylodipus telum", category: "Грызуны (Rodentia)", status: "Степной вид" },

  // Насекомоядные (Eulipotyphla)
  { id: "hemiechinus_auritus", name: "Ушастый ёж", latinName: "Hemiechinus auritus", category: "Насекомоядные (Eulipotyphla)", status: "Обычный вид" },
  { id: "erinaceus_roumanicus", name: "Южный ёж", latinName: "Erinaceus roumanicus", category: "Насекомоядные (Eulipotyphla)", status: "Обычный вид" },
  { id: "sorex_minutus", name: "Малая бурозубка", latinName: "Sorex minutus", category: "Насекомоядные (Eulipotyphla)", status: "Малочисленный вид" },
  { id: "sorex_araneus", name: "Обыкновенная бурозубка", latinName: "Sorex araneus", category: "Насекомоядные (Eulipotyphla)", status: "Обычный вид" },
  { id: "crocidura_suaveolens", name: "Малая белозубка", latinName: "Crocidura suaveolens", category: "Насекомоядные (Eulipotyphla)", status: "Обычный вид" },
  { id: "suncus_etruscus", name: "Карликовая многозубка", latinName: "Suncus etruscus", category: "Насекомоядные (Eulipotyphla)", status: "Редкий вид" },

  // Рукокрылые (Chiroptera)
  { id: "eptesicus_serotinus", name: "Поздний кожан", latinName: "Eptesicus serotinus", category: "Рукокрылые (Chiroptera)", status: "Обычный вид" },
  { id: "myotis_daubentonii", name: "Водяная ночница", latinName: "Myotis daubentonii", category: "Рукокрылые (Chiroptera)", status: "Околоводный вид" },
  { id: "myotis_davidii", name: "Степная ночница", latinName: "Myotis davidii", category: "Рукокрылые (Chiroptera)", status: "Редкий вид" },

  // Зайцеобразные (Lagomorpha)
  { id: "lepus_europaeus", name: "Заяц-русак", latinName: "Lepus europaeus", category: "Зайцеобразные (Lagomorpha)", status: "Промысловый вид" },
  { id: "lepus_tolai", name: "Заяц-толай", latinName: "Lepus tolai", category: "Зайцеобразные (Lagomorpha)", status: "Степной вид" },
  { id: "ochotona_pusilla", name: "Малая пищуха", latinName: "Ochotona pusilla", category: "Зайцеобразные (Lagomorpha)", status: "Редкий вид" },

  // Хищные (Carnivora)
  { id: "mustela_eversmanii", name: "Степной хорёк", latinName: "Mustela eversmanii", category: "Хищные (Carnivora)", status: "Обычный вид" },
  { id: "mustela_nivalis", name: "Обыкновенная ласка", latinName: "Mustela nivalis", category: "Хищные (Carnivora)", status: "Обычный вид" },
  { id: "mustela_erminea", name: "Горностай", latinName: "Mustela erminea", category: "Хищные (Carnivora)", status: "Обычный вид" },
  { id: "meles_leucurus", name: "Азиатский барсук", latinName: "Meles leucurus", category: "Хищные (Carnivora)", status: "Обычный вид" },
  { id: "martes_foina", name: "Каменная куница", latinName: "Martes foina", category: "Хищные (Carnivora)", status: "Редкий вид" },
  { id: "lutra_lutra", name: "Выдра", latinName: "Lutra lutra", category: "Хищные (Carnivora)", status: "Красная книга" },
  { id: "vulpes_vulpes", name: "Обыкновенная лисица", latinName: "Vulpes vulpes", category: "Хищные (Carnivora)", status: "Обычный вид" },
  { id: "vulpes_corsac", name: "Корсак", latinName: "Vulpes corsac", category: "Хищные (Carnivora)", status: "Степной хищник" },
  { id: "canis_lupus", name: "Волк", latinName: "Canis lupus", category: "Хищные (Carnivora)", status: "Промысловый вид" },
  { id: "felis_lybica", name: "Степной кот", latinName: "Felis lybica", category: "Хищные (Carnivora)", status: "Обычный вид" },
  { id: "felis_margarita", name: "Барханный кот", latinName: "Felis margarita", category: "Хищные (Carnivora)", status: "Красная книга" },
  { id: "caracal_caracal", name: "Каракал", latinName: "Caracal caracal", category: "Хищные (Carnivora)", status: "Красная книга" },
  { id: "lynx_lynx", name: "Обыкновенная рысь", latinName: "Lynx lynx", category: "Хищные (Carnivora)", status: "Редкий вид" },
  { id: "ursus_arctos", name: "Бурый медведь", latinName: "Ursus arctos", category: "Хищные (Carnivora)", status: "Заходной вид" },

  // Парнокопытные (Artiodactyla)
  { id: "gazella_subgutturosa", name: "Джейран", latinName: "Gazella subgutturosa", category: "Парнокопытные (Artiodactyla)", status: "Красная книга" },
  { id: "saiga_tatarica", name: "Сайгак", latinName: "Saiga tatarica", category: "Парнокопытные (Artiodactyla)", status: "Особо охраняемый вид" },
  { id: "capreolus_pygargus", name: "Сибирская косуля", latinName: "Capreolus pygargus", category: "Парнокопытные (Artiodactyla)", status: "Обычный вид" },
  { id: "sus_scrofa", name: "Кабан", latinName: "Sus scrofa", category: "Парнокопытные (Artiodactyla)", status: "Обычный вид" }
];

// Перечень биотопов ГПЗ «Эбита»
export const BIOTOPES_LIST = [
  "Разнотравно-ковыльная степь",
  "Ковыльно-типчаковая степь",
  "Полынно-типчаковая степь",
  "Каменистая и петрофитная степь",
  "Степные холмы и остепнённые склоны",
  "Берёзовые колочные леса",
  "Ольховые колочные леса",
  "Тополевые колочные леса",
  "Смешанные колочные леса",
  "Степные кустарниковые заросли",
  "Тугайные древесно-кустарниковые заросли",
  "Пойменные луга",
  "Речные долины и поймы",
  "Овражно-балочные и ущельевые комплексы",
  "Скально-каменистые участки и обнажения"
];

// Типы обнаружения
export const DETECTION_TYPES = [
  "Непосредственное наблюдение",
  "Следы",
  "Нора / убежище",
  "Помёт",
  "Погрызы",
  "Фотоловушка",
  "Останки",
  "Другое"
];

// Исходный список наблюдений (пустой по умолчанию)
export const INITIAL_OBSERVATIONS = [];
