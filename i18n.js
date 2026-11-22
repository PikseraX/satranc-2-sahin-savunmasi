(function () {
    'use strict';

    const STORAGE_KEY = 'satranc2_lang_v1';

    const LANGS = [
        { code: 'tr', short: 'TR', flag: '🇹🇷', name: 'Türkçe' },
        { code: 'en', short: 'EN', flag: '🇬🇧', name: 'English' },
        { code: 'de', short: 'DE', flag: '🇩🇪', name: 'Deutsch' },
        { code: 'fr', short: 'FR', flag: '🇫🇷', name: 'Français' },
        { code: 'it', short: 'IT', flag: '🇮🇹', name: 'Italiano' },
        { code: 'es', short: 'ES', flag: '🇪🇸', name: 'Español' },
        { code: 'pt', short: 'PT', flag: '🇧🇷', name: 'Português' },
        { code: 'ru', short: 'RU', flag: '🇷🇺', name: 'Русский' },
        { code: 'ja', short: 'JA', flag: '🇯🇵', name: '日本語' },
        { code: 'el', short: 'EL', flag: '🇬🇷', name: 'Ελληνικά' },
        { code: 'zh-CN', short: 'ZH', flag: '🇨🇳', name: '简体中文' },
        { code: 'zh-TW', short: 'TW', flag: '🇹🇼', name: '繁體中文' }
    ];

    const CODES = ['en', 'de', 'fr', 'it', 'es', 'pt', 'ru', 'ja', 'el', 'zh-CN', 'zh-TW'];

    const EXACT_ROWS = {
        'SATRANÇ 2': ['CHESS 2', 'SCHACH 2', 'ÉCHECS 2', 'SCACCHI 2', 'AJEDREZ 2', 'XADREZ 2', 'ШАХМАТЫ 2', 'チェス 2', 'ΣΚΑΚΙ 2', '国际象棋 2', '西洋棋 2'],
        "SATRANÇ 2: ŞAH'IN SAVUNMASI": ['CHESS 2: KING’S DEFENSE', 'SCHACH 2: KÖNIGSVERTEIDIGUNG', 'ÉCHECS 2 : DÉFENSE DU ROI', 'SCACCHI 2: DIFESA DEL RE', 'AJEDREZ 2: DEFENSA DEL REY', 'XADREZ 2: DEFESA DO REI', 'ШАХМАТЫ 2: ЗАЩИТА КОРОЛЯ', 'チェス 2：王の防衛', 'ΣΚΑΚΙ 2: ΑΜΥΝΑ ΤΟΥ ΒΑΣΙΛΙΑ', '国际象棋 2：国王防卫战', '西洋棋 2：國王防衛戰'],
        '👑 ŞAH SINIFINI SEÇ (Atak / Savunma / Özel Güç):': ['👑 CHOOSE KING CLASS (Attack / Defense / Power):', '👑 KÖNIGSKLASSE WÄHLEN (Angriff / Schutz / Macht):', '👑 CHOISIS LA CLASSE DU ROI :', '👑 SCEGLI LA CLASSE DEL RE:', '👑 ELIGE CLASE DEL REY:', '👑 ESCOLHA A CLASSE DO REI:', '👑 ВЫБЕРИТЕ КЛАСС КОРОЛЯ:', '👑 王のクラスを選択：', '👑 ΕΠΙΛΕΞΕ ΚΛΑΣΗ ΒΑΣΙΛΙΑ:', '👑 选择国王职业（攻击/防御/技能）：', '👑 選擇國王職業（攻擊/防禦/技能）：'],
        '⚔️ YENİ OYUNA BAŞLA': ['⚔️ START NEW GAME', '⚔️ NEUES SPIEL', '⚔️ NOUVELLE PARTIE', '⚔️ NUOVA PARTITA', '⚔️ NUEVA PARTIDA', '⚔️ NOVO JOGO', '⚔️ НОВАЯ ИГРА', '⚔️ 新規ゲーム開始', '⚔️ ΝΕΟ ΠΑΙΧΝΙΔΙ', '⚔️ 开始新游戏', '⚔️ 開始新遊戲'],
        'Seçili Şah İle Başlat': ['Start with Selected King', 'Mit gewähltem König starten', 'Démarrer avec ce Roi', 'Inizia con il Re scelto', 'Iniciar con Rey elegido', 'Iniciar com Rei escolhido', 'Начать с выбранным Королём', '選択した王で開始', 'Έναρξη με επιλεγμένο Βασιλιά', '使用已选国王开始', '使用已選國王開始'],
        '▶️ DEVAM ET': ['▶️ CONTINUE', '▶️ FORTSETZEN', '▶️ CONTINUER', '▶️ CONTINUA', '▶️ CONTINUAR', '▶️ CONTINUAR', '▶️ ПРОДОЛЖИТЬ', '▶️ 続ける', '▶️ ΣΥΝΕΧΕΙΑ', '▶️ 继续游戏', '▶️ 繼續遊戲'],
        'Kaldığın Dalgadan Sürdür': ['Resume Saved Wave', 'Ab letzter Welle fortsetzen', 'Reprendre la vague sauvegardée', 'Riprendi dall’ondata salvata', 'Reanudar oleada guardada', 'Retomar onda salva', 'Продолжить с сохранённой волны', 'セーブしたウェーブから再開', 'Συνέχεια από το αποθηκευμένο κύμα', '从上次保存的波次继续', '從上次儲存的波次繼續'],
        'YETENEK AĞACI': ['TALENT TREE', 'TALENTBAUM', 'TALENTS', 'TALENTI', 'TALENTOS', 'TALENTOS', 'ТАЛАНТЫ', 'スキルツリー', 'ΤΑΛΕΝΤΑ', '天赋树', '天賦樹'],
        'MAĞAZA': ['SHOP', 'SHOP', 'BOUTIQUE', 'NEGOZIO', 'TIENDA', 'LOJA', 'МАГАЗИН', 'ショップ', 'ΚΑΤΑΣΤΗΜΑ', '商店', '商店'],
        'BAŞARIM & BOSS': ['CODEX & BOSS', 'ERFOLGE & BOSS', 'SUCCÈS & BOSS', 'TROFEI & BOSS', 'LOGROS Y BOSS', 'CONQUISTAS', 'ДОСТИЖЕНИЯ', '実績＆ボス', 'ΕΠΙΤΕΥΓΜΑΤΑ', '成就与Boss', '成就與Boss'],
        'REHBER': ['GUIDE', 'GUIDE', 'GUIDE', 'GUIDA', 'GUÍA', 'GUIA', 'ГИД', 'ガイド', 'ΟΔΗΓΟΣ', '指南', '指南'],
        '📅 GÜNLÜK KUŞATMA': ['📅 DAILY SIEGE', '📅 TÄGLICHE BELAGERUNG', '📅 SIÈGE QUOTIDIEN', '📅 ASSEDIO GIORNALIERO', '📅 ASEDIO DIARIO', '📅 CERCO DIÁRIO', '📅 ОСАДА ДНЯ', '📅 デイリー包囲戦', '📅 ΗΜΕΡΗΣΙΑ ΠΟΛΙΟΡΚΙΑ', '📅 每日攻城战', '📅 每日攻城戰'],
        '⚔️ Başlat': ['⚔️ Start', '⚔️ Start', '⚔️ Lancer', '⚔️ Avvia', '⚔️ Iniciar', '⚔️ Iniciar', '⚔️ Старт', '⚔️ 開始', '⚔️ Έναρξη', '⚔️ 开始', '⚔️ 開始'],
        '+45 💎 (5 Dalga)': ['+45 💎 (5 Waves)', '+45 💎 (5 Wellen)', '+45 💎 (5 Vagues)', '+45 💎 (5 Ondate)', '+45 💎 (5 Oleadas)', '+45 💎 (5 Ondas)', '+45 💎 (5 волн)', '+45 💎 (5ウェーブ)', '+45 💎 (5 Κύματα)', '+45 💎 (5波)', '+45 💎 (5波)'],
        '✅ Bugün Tamamlandı': ['✅ Done Today', '✅ Heute erledigt', '✅ Terminé', '✅ Completato', '✅ Completado', '✅ Concluído', '✅ Пройдено', '✅ 本日クリア済', '✅ Ολοκληρώθηκε', '✅ 今日已完成', '✅ 今日已完成'],
        '🪙 +80 Altın': ['🪙 +80 Gold', '🪙 +80 Gold', '🪙 +80 Or', '🪙 +80 Oro', '🪙 +80 Oro', '🪙 +80 Ouro', '🪙 +80 золота', '🪙 +80ゴールド', '🪙 +80 Χρυσός', '🪙 +80 金币', '🪙 +80 金幣'],
        '🛡️ +6 Şah HP': ['🛡️ +6 King HP', '🛡️ +6 König-HP', '🛡️ +6 PV Roi', '🛡️ +6 HP Re', '🛡️ +6 HP Rey', '🛡️ +6 HP Rei', '🛡️ +6 HP Короля', '🛡️ 王HP+6', '🛡️ +6 HP Βασιλιά', '🛡️ 国王+6生命', '🛡️ 國王+6生命'],
        '♟️ +1 Muhafız': ['♟️ +1 Guard', '♟️ +1 Wache', '♟️ +1 Garde', '♟️ +1 Guardia', '♟️ +1 Guardia', '♟️ +1 Guarda', '♟️ +1 страж', '♟️ 護衛+1', '♟️ +1 Φρουρός', '♟️ +1 护卫兵', '♟️ +1 護衛兵'],
        '🔊 Ses Açık': ['🔊 Sound On', '🔊 Ton Ein', '🔊 Son Oui', '🔊 Audio Sì', '🔊 Sonido Sí', '🔊 Som Sim', '🔊 Звук Вкл', '🔊 音オン', '🔊 Ήχος Ναι', '🔊 音效开', '🔊 音效開'],
        '🔇 Sessiz': ['🔇 Muted', '🔇 Stumm', '🔇 Muet', '🔇 Muto', '🔇 Silencio', '🔇 Mudo', '🔇 Без звука', '🔇 ミュート', '🔇 Σίγαση', '🔇 静音', '🔇 靜音'],
        '⏩ Hız: 1x': ['⏩ Speed: 1x', '⏩ Tempo: 1x', '⏩ Vitesse : 1x', '⏩ Velocità: 1x', '⏩ Vel.: 1x', '⏩ Vel.: 1x', '⏩ Скор.: 1x', '⏩ 速度: 1x', '⏩ Ταχύτ.: 1x', '⏩ 速度: 1x', '⏩ 速度: 1x'],
        '⏩ Hız: 2x': ['⏩ Speed: 2x', '⏩ Tempo: 2x', '⏩ Vitesse : 2x', '⏩ Velocità: 2x', '⏩ Vel.: 2x', '⏩ Vel.: 2x', '⏩ Скор.: 2x', '⏩ 速度: 2x', '⏩ Ταχύτ.: 2x', '⏩ 速度: 2x', '⏩ 速度: 2x'],
        '📳 Titreşim: Açık': ['📳 Haptics: On', '📳 Vibr.: Ein', '📳 Vibr. : Oui', '📳 Vibr.: Sì', '📳 Vibr.: Sí', '📳 Vibr.: Sim', '📳 Вибр.: Вкл', '📳 振動: ON', '📳 Δόνηση: Ναι', '📳 震动: 开', '📳 震動: 開'],
        '📳 Titreşim: Kapalı': ['📳 Haptics: Off', '📳 Vibr.: Aus', '📳 Vibr. : Non', '📳 Vibr.: No', '📳 Vibr.: No', '📳 Vibr.: Não', '📳 Вибр.: Выкл', '📳 振動: OFF', '📳 Δόνηση: Όχι', '📳 震动: 关', '📳 震動: 關'],
        '👑 Menü': ['👑 Menu', '👑 Menü', '👑 Menu', '👑 Menu', '👑 Menú', '👑 Menu', '👑 Меню', '👑 メニュー', '👑 Μενού', '👑 菜单', '👑 選單'],
        '🏆 Kitap': ['🏆 Codex', '🏆 Kodex', '🏆 Codex', '🏆 Codice', '🏆 Códice', '🏆 Códice', '🏆 Кодекс', '🏆 図鑑', '🏆 Κώδικας', '🏆 图鉴', '🏆 圖鑑'],
        'ŞAH DÜŞTÜ!': ['KING FALLEN!', 'KÖNIG GEFALLEN!', 'LE ROI EST TOMBÉ !', 'IL RE È CADUTO!', '¡EL REY HA CAÍDO!', 'O REI CAIU!', 'КОРОЛЬ ПАЛ!', '王が倒れた！', 'Ο ΒΑΣΙΛΙΑΣ ΕΠΕΣΕ!', '国王阵亡！', '國王陣亡！'],
        '🎬 Video İzle → Bölüm Başına Dön (+50 🪙)': ['🎬 Watch Video → Restart Chapter (+50 🪙)', '🎬 Video ansehen → Kapitel neu (+50 🪙)', '🎬 Voir vidéo → Début chapitre (+50 🪙)', '🎬 Guarda video → Inizio capitolo (+50 🪙)', '🎬 Ver video → Inicio capítulo (+50 🪙)', '🎬 Ver vídeo → Início capítulo (+50 🪙)', '🎬 Смотреть видео → В начало главы (+50 🪙)', '🎬 動画視聴 → 章の最初から (+50 🪙)', '🎬 Δες βίντεο → Αρχή κεφαλαίου (+50 🪙)', '🎬 看视频 → 从本章重来 (+50 🪙)', '🎬 看影片 → 從本章重來 (+50 🪙)'],
        '💀 OYUNU BİTİR — EN BAŞA DÖN (BÖLÜM 1)': ['💀 END RUN — BACK TO CHAPTER 1', '💀 BEENDEN — ZURÜCK ZU KAPITEL 1', '💀 TERMINER — RETOUR CHAPITRE 1', '💀 TERMINA — TORNA AL CAPITOLO 1', '💀 TERMINAR — VOLVER AL CAPÍTULO 1', '💀 ENCERRAR — VOLTAR AO CAPÍTULO 1', '💀 ЗАВЕРШИТЬ — В ГЛАВУ 1', '💀 終了 — 第1章へ戻る', '💀 ΤΕΛΟΣ — ΠΙΣΩ ΣΤΟ ΚΕΦΑΛΑΙΟ 1', '💀 结束本局 — 返回第1章', '💀 結束本局 — 返回第1章'],
        '🎬 Video İzle → Fermanları Yenile (Reroll)': ['🎬 Watch Video → Reroll Decrees', '🎬 Video ansehen → Erlasse neu würfeln', '🎬 Voir vidéo → Relancer les Décrets', '🎬 Guarda video → Cambia Decreti', '🎬 Ver video → Renovar Decretos', '🎬 Ver vídeo → Trocar Decretos', '🎬 Смотреть видео → Обновить указы', '🎬 動画視聴 → 勅令を引き直す', '🎬 Δες βίντεο → Ανανέωση Διαταγμάτων', '🎬 看视频 → 刷新诏书', '🎬 看影片 → 刷新詔書'],
        '🛒 KRALİYET MAĞAZASI': ['🛒 ROYAL SHOP', '🛒 KÖNIGLICHER SHOP', '🛒 BOUTIQUE ROYALE', '🛒 NEGOZIO REALE', '🛒 TIENDA REAL', '🛒 LOJA REAL', '🛒 КОРОЛЕВСКИЙ МАГАЗИН', '🛒 王室ショップ', '🛒 ΒΑΣΙΛΙΚΟ ΚΑΤΑΣΤΗΜΑ', '🛒 皇家商店', '🛒 皇家商店'],
        '💎 KALICI YETENEK AĞACI (4 UZMANLIK YOLU)': ['💎 PERMANENT TALENT TREE (4 PATHS)', '💎 PERMANENTER TALENTBAUM (4 PFADE)', '💎 ARBRE DE TALENTS (4 VOIES)', '💎 ALBERO TALENTI (4 VIE)', '💎 ÁRBOL DE TALENTOS (4 RAMAS)', '💎 ÁRVORE DE TALENTOS (4 VIAS)', '💎 ДРЕВО ТАЛАНТОВ (4 ПУТИ)', '💎 永続スキルツリー（4系統）', '💎 ΔΕΝΤΡΟ ΤΑΛΕΝΤΩΝ (4 ΔΡΟΜΟΙ)', '💎 永久天赋树（4条路线）', '💎 永久天賦樹（4條路線）'],
        '🏆 BAŞARIMLAR & 👹 BOSS KİTABI': ['🏆 ACHIEVEMENTS & 👹 BOSS CODEX', '🏆 ERFOLGE & 👹 BOSS-KODEX', '🏆 SUCCÈS & 👹 BESTIAIRE BOSS', '🏆 TROFEI & 👹 CODICE BOSS', '🏆 LOGROS Y 👹 CÓDICE DE JEFES', '🏆 CONQUISTAS & 👹 CHEFES', '🏆 ДОСТИЖЕНИЯ И 👹 БОССЫ', '🏆 実績＆👹 ボス図鑑', '🏆 ΕΠΙΤΕΥΓΜΑΤΑ & 👹 BOSS', '🏆 成就与👹 Boss图鉴', '🏆 成就與👹 Boss圖鑑'],
        '📖 Hızlı Savaş Rehberi': ['📖 Quick Battle Guide', '📖 Kurzer Kampf-Guide', '📖 Guide Rapide', '📖 Guida Rapida', '📖 Guía Rápida', '📖 Guia Rápido', '📖 Краткий справочник', '📖 クイックバトルガイド', '📖 Γρήγορος Οδηγός Μάχης', '📖 快速战斗指南', '📖 快速戰鬥指南'],
        '⚡ Savaş': ['⚡ Combat', '⚡ Kampf', '⚡ Combat', '⚡ Battaglia', '⚡ Combate', '⚡ Combate', '⚡ Бой', '⚡ 戦闘', '⚡ Μάχη', '⚡ 战斗', '⚡ 戰鬥'],
        '🌋 Biyomlar': ['🌋 Biomes', '🌋 Biome', '🌋 Biomes', '🌋 Biomi', '🌋 Biomas', '🌋 Biomas', '🌋 Биомы', '🌋 バイオーム', '🌋 Βιότοποι', '🌋 地形', '🌋 地形'],
        '👑 Terfi & Ferman': ['👑 Promos & Decrees', '👑 Aufstieg & Erlasse', '👑 Promos & Décrets', '👑 Promozioni', '👑 Ascensos', '👑 Promoções', '👑 Улучшения', '👑 昇格＆勅令', '👑 Προαγωγές', '👑 晋升与诏书', '👑 晉升與詔書'],
        'ANLADIM, SAVAŞA DÖN': ['GOT IT, BACK TO BATTLE', 'VERSTANDEN, ZURÜCK', 'COMPRIS, AU COMBAT', 'CAPITO, TORNA IN BATTAGLIA', 'ENTENDIDO, AL COMBATE', 'ENTENDI, VOLTAR', 'ПОНЯТНО, В БОЙ', '了解、戦場へ戻る', 'ΕΝΤΑΞΕΙ, ΠΙΣΩ ΣΤΗ ΜΑΧΗ', '明白了，返回战场', '明白了，返回戰場'],
        '🌐 Dil Seçimi': ['🌐 Language', '🌐 Sprache', '🌐 Langue', '🌐 Lingua', '🌐 Idioma', '🌐 Idioma', '🌐 Язык', '🌐 言語選択', '🌐 Επιλογή Γλώσσας', '🌐 语言选择', '🌐 語言選擇'],
        'DALGA TAMAMLANDI': ['WAVE CLEARED', 'WELLE GESCHAFFT', 'VAGUE TERMINÉE', 'ONDATA COMPLETATA', 'OLEADA SUPERADA', 'ONDA CONCLUÍDA', 'ВОЛНА ПРОЙДЕНА', 'ウェーブクリア', 'ΚΥΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ', '波次已清除', '波次已清除'],
        'KRALİYET DİVANI TOPLANDI': ['ROYAL COUNCIL CONVENED', 'KÖNIGSRAT VERSAMMELT', 'CONSEIL ROYAL RÉUNI', 'CONSIGLIO REALE RIUNITO', 'CONSEJO REAL REUNIDO', 'CONSELHO REAL REUNIDO', 'КОРОЛЕВСКИЙ СОВЕТ', '王室評議会が開かれた', 'ΒΑΣΙΛΙΚΟ ΣΥΜΒΟΥΛΙΟ', '皇家议会召开', '皇家議會召開'],
        '👑 ANA MENÜYE DÖN': ['👑 BACK TO MENU', '👑 ZUM HAUPTMENÜ', '👑 RETOUR AU MENU', '👑 TORNA AL MENU', '👑 VOLVER AL MENÚ', '👑 VOLTAR AO MENU', '👑 В ГЛАВНОЕ МЕНЮ', '👑 メニューへ戻る', '👑 ΠΙΣΩ ΣΤΟ ΜΕΝΟΥ', '👑 返回主菜单', '👑 返回主選單'],
        '📅 GÜNLÜK KUŞATMA TAMAMLANDI!': ['📅 DAILY SIEGE CLEARED!', '📅 TÄGLICHE BELAGERUNG GESCHAFFT!', '📅 SIÈGE QUOTIDIEN RÉUSSI !', '📅 ASSEDIO GIORNALIERO COMPLETATO!', '📅 ¡ASEDIO DIARIO SUPERADO!', '📅 CERCO DIÁRIO CONCLUÍDO!', '📅 ОСАДА ДНЯ ПРОЙДЕНА!', '📅 デイリー包囲戦クリア！', '📅 ΗΜΕΡΗΣΙΑ ΠΟΛΙΟΡΚΙΑ ΟΛΟΚΛΗΡΩΘΗΚΕ!', '📅 每日攻城战通关！', '📅 每日攻城戰通關！']
    };

    const DICT = {};
    for (const c of CODES) DICT[c] = new Map();
    for (const [tr, arr] of Object.entries(EXACT_ROWS)) {
        CODES.forEach((c, i) => { if (arr[i]) DICT[c].set(tr, arr[i]); });
    }

    let currentLang = 'tr';
    const originalTextMap = new WeakMap();
    const lastAppliedMap = new WeakMap();
    let isApplying = false;

    function loadSavedLang() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && LANGS.some(l => l.code === saved)) return saved;
        } catch (e) {}
        return 'tr';
    }

    function saveLang(code) {
        try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
    }

    const SG_CONT_TPL = {
        en: (c, w) => w ? `💎 ${c} Gems → Continue from Wave ${w}` : `💎 ${c} Gems → Continue Current Wave`,
        de: (c, w) => w ? `💎 ${c} Juwelen → Ab Welle ${w} fortfahren` : `💎 ${c} Juwelen → Aktuelle Welle fortfahren`,
        es: (c, w) => w ? `💎 ${c} Gemas → Seguir desde Oleada ${w}` : `💎 ${c} Gemas → Seguir Oleada Actual`,
        fr: (c, w) => w ? `💎 ${c} Gemmes → Reprendre Vague ${w}` : `💎 ${c} Gemmes → Reprendre la Vague`,
        pt: (c, w) => w ? `💎 ${c} Gemas → Continuar na Onda ${w}` : `💎 ${c} Gemas → Continuar Onda Atual`,
        it: (c, w) => w ? `💎 ${c} Gemme → Continua dall'Ondata ${w}` : `💎 ${c} Gemme → Continua Ondata`,
        ru: (c, w) => w ? `💎 ${c} Камней → Продолжить с Волны ${w}` : `💎 ${c} Камней → Продолжить Волну`,
        ja: (c, w) => w ? `💎 ${c} 宝石 → ウェーブ${w}から続行` : `💎 ${c} 宝石 → 現在のウェーブから続行`,
        ko: (c, w) => w ? `💎 ${c} 보석 → 웨이브 ${w}에서 계속` : `💎 ${c} 보석 → 현재 웨이브 계속`,
        zh: (c, w) => w ? `💎 ${c} 宝石 → 从第 ${w} 波继续` : `💎 ${c} 宝石 → 继续当前波次`,
        ar: (c, w) => w ? `💎 ${c} جوهرة ← متابعة من الموجة ${w}` : `💎 ${c} جوهرة ← متابعة الموجة الحالية`
    };

    function translateText(trText, lang) {
        if (!trText || lang === 'tr') return trText;
        const trimmed = trText.trim();
        if (!trimmed) return trText;
        const dict = DICT[lang];
        if (dict && dict.has(trimmed)) {
            return trText.replace(trimmed, dict.get(trimmed));
        }
        const m = trimmed.match(/^💎 (\d+) Elmas → (?:Öldüğün|Kaldığın) Dalgadan Devam Et(?: \(Dalga (\d+)\))?$/);
        if (m && SG_CONT_TPL[lang]) {
            return trText.replace(trimmed, SG_CONT_TPL[lang](m[1], m[2]));
        }
        return trText;
    }

    function shouldSkipNode(node) {
        const parent = node.parentElement;
        if (!parent) return true;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'INPUT') return true;
        if (parent.closest && parent.closest('#lang-list-grid')) return true;
        if (parent.id === 'btn-lang-top' || parent.id === 'btn-lang-splash-code') return true;
        return false;
    }

    function processTextNode(node) {
        if (shouldSkipNode(node)) return;
        const val = node.nodeValue;
        if (!val || !val.trim()) return;

        let orig = originalTextMap.get(node);
        const lastApplied = lastAppliedMap.get(node);
        if (orig === undefined) {
            originalTextMap.set(node, val);
            orig = val;
        } else if (lastApplied !== undefined && val !== lastApplied) {
            originalTextMap.set(node, val);
            orig = val;
        }

        const nextVal = currentLang === 'tr' ? orig : translateText(orig, currentLang);
        lastAppliedMap.set(node, nextVal);
        if (node.nodeValue !== nextVal) {
            node.nodeValue = nextVal;
        }
    }

    function applyToDOM(root) {
        const target = root || document.body;
        if (!target) return;
        isApplying = true;
        try {
            const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
            let node;
            while ((node = walker.nextNode())) processTextNode(node);
            const langObj = LANGS.find(l => l.code === currentLang) || LANGS[0];
            const topBtn = document.getElementById('btn-lang-top');
            if (topBtn) topBtn.textContent = `🌐 ${langObj.short}`;
            const splashCode = document.getElementById('btn-lang-splash-code');
            if (splashCode) splashCode.textContent = langObj.short;
            document.documentElement.lang = currentLang;
        } finally {
            isApplying = false;
        }
    }

    function renderLangGrid() {
        const grid = document.getElementById('lang-list-grid');
        if (!grid) return;
        grid.innerHTML = '';
        LANGS.forEach(item => {
            const active = item.code === currentLang;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.langCode = item.code;
            btn.className = `flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-extrabold transition active:scale-95 ${
                active
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`;
            btn.innerHTML = `<span class="text-base leading-none">${item.flag}</span><span class="truncate">${item.name}</span>`;
            btn.addEventListener('click', () => {
                setLang(item.code);
                document.getElementById('lang-modal')?.classList.add('hidden');
            });
            grid.appendChild(btn);
        });
    }

    function setLang(code) {
        if (!LANGS.some(l => l.code === code)) return false;
        currentLang = code;
        saveLang(code);
        applyToDOM(document.body);
        renderLangGrid();
        return true;
    }

    function init() {
        currentLang = loadSavedLang();
        const modal = document.getElementById('lang-modal');
        const openModal = () => {
            if (!modal) return;
            renderLangGrid();
            modal.classList.remove('hidden');
        };
        document.getElementById('btn-lang-top')?.addEventListener('click', openModal);
        document.getElementById('btn-lang-splash')?.addEventListener('click', openModal);
        document.getElementById('btn-close-lang')?.addEventListener('click', () => modal?.classList.add('hidden'));
        modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

        renderLangGrid();
        applyToDOM(document.body);

        const observer = new MutationObserver((mutations) => {
            if (isApplying || currentLang === 'tr') return;
            isApplying = true;
            try {
                for (const m of mutations) {
                    if (m.type === 'characterData') {
                        processTextNode(m.target);
                    } else if (m.type === 'childList') {
                        m.addedNodes.forEach(n => {
                            if (n.nodeType === Node.TEXT_NODE) processTextNode(n);
                            else if (n.nodeType === Node.ELEMENT_NODE) {
                                const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null);
                                let tn;
                                while ((tn = w.nextNode())) processTextNode(tn);
                            }
                        });
                    }
                }
            } finally {
                isApplying = false;
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    window.Satranc2I18n = {
        LANGS,
        getLang: () => currentLang,
        setLang,
        translateText,
        applyToDOM
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
