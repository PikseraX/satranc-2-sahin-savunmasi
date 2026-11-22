const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../satran_2_tam_s_r_m_3d_webgl_s_r_m.html'), 'utf8');
const element = () => ({ classList: { add() {}, remove() {} }, appendChild() {}, style: {} });
const context = {
    document: { getElementById: element, createElement: element },
    window: {},
    localStorage: { setItem() {}, getItem() {}, removeItem() {} },
    setTimeout() {},
};
vm.createContext(context);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace('window.game = new ChessDefenseGame();', 'window.Game = ChessDefenseGame;'), context);

function game() {
    const game = Object.create(context.window.Game.prototype);
    Object.assign(game, {
        gridSize: 11, selectedKingClass: 'MAGE', chapter: 1, wave: 1, maxChapters: 10,
        gold: 100, soulGems: 0, totalKills: 0, talents: {}, unlockedAchievements: {},
        defeatedBosses: {}, lifetimeStats: {}, iceTiles: [], lavaTiles: [], currentDecreeChoices: [],
    });
    for (const name of ['apply3DBiomeColors', 'updateCommanderSkillUI', 'updateLeftPanelUI',
        'selectPiece', 'updateTopLeftUI', 'updateRightPanelUI', 'updateHQModalUI', 'showBanner',
        'playSound', 'spawnBurstParticles', 'addFloatingText', 'triggerScreenShake',
        'openPromotionModal', 'refreshSplashButtons']) game[name] = () => {};
    game.initBoardSetup();
    Object.assign(game, { pieces: [], rocks: [], iceTiles: [], lavaTiles: [], activeContract: null, waveTotalEnemies: 99 });
    return game;
}

let g = game();
const king = g.spawnPiece('KING', 'ALLY', 5, 5, 2, 2, 'N');
g.selectedPiece = g.spawnPiece('PAWN', 'ENEMY', 5, 4, 1, 1, 'S', 'BOMBER_PAWN');
g.waveTotalEnemies = g.waveSpawnedCount = 1;
g.useCommanderSkill('primary');
assert.equal(g.phase, 'GAMEOVER');
assert.equal(g.pieces.includes(king), false);

g = game();
g.spawnPiece('KING', 'ALLY', 5, 5, 12, 2, 'N');
g.phase = 'HQ';
g.wave = 2;
g.startNextWaveFromHQ();
assert.equal(g.activeContract.turnsElapsed, 1);
g.startPlayerTurn();
assert.equal(g.activeContract.turnsElapsed, 2);

g = game();
g.lavaTiles = [{ x: 5, y: 4 }];
const rook = g.spawnPiece('ROOK', 'ALLY', 5, 6, 10, 20, 'N');
g.performCombatAttack(rook, g.spawnPiece('PAWN', 'ENEMY', 5, 4, 1, 1, 'S'));
assert.equal(rook.hp, 8);

g = game();
g.lavaTiles = [{ x: 4, y: 4 }];
const castleKing = g.spawnPiece('KING', 'ALLY', 5, 5, 12, 2, 'N');
g.triggerCastlingWithRook(castleKing, g.spawnPiece('ROOK', 'ALLY', 4, 4, 7, 3, 'N'));
assert.equal(castleKing.hp, 10);

g = game();
const attacker = g.spawnPiece('KING', 'ALLY', 8, 8, 20, 2, 'N');
const first = g.spawnPiece('PAWN', 'ENEMY', 4, 4, 1, 1, 'N', 'BOMBER_PAWN');
const second = g.spawnPiece('PAWN', 'ENEMY', 5, 4, 2, 1, 'N', 'BOMBER_PAWN');
const bystander = g.spawnPiece('PAWN', 'ALLY', 6, 4, 8, 1, 'N');
g.handleEnemyKilledByAlly(attacker, first);
assert.equal(g.pieces.includes(second), false);
assert.equal(bystander.hp, 5);
assert.equal(g.totalKills, 2);
g.handleEnemyKilledByAlly(attacker, first);
assert.equal(g.totalKills, 2);

g = game();
const mover = g.spawnPiece('ROOK', 'ALLY', 5, 5, 10, 2, 'N');
mover.movesLeft = 1;
g.spawnPiece('PAWN', 'ENEMY', 6, 5, 10, 1, 'N');
assert.equal(g.getActionsForPiece(mover, false).moves.some(m => m.x === 5 && m.y === 4), false);
g.executePlayerMove(mover, 5, 4);
assert.equal(mover.y, 5);
mover.movesLeft = 2;
g.executePlayerMove(mover, 5, 4);
assert.equal(mover.y, 4);
assert.equal(mover.movesLeft, 0);

console.log('PASS: defeat priority, contract turns, capture/castling hazards, bomber chain, AP cost');

g = game();
g.selectedKingClass = 'WARRIOR';
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 5, 'N');
g.spawnPiece('PAWN', 'ENEMY', 6, 5, 2, 1, 'N');
g.lavaTiles = [{ x: 7, y: 5 }];
g.waveTotalEnemies = g.waveSpawnedCount = 1;
const achievements = [];
g.unlockAchievement = id => achievements.push(id);
g.useCommanderSkill('primary');
assert.equal(achievements.includes('PAWN_REVOLUTION'), false);
assert.equal(achievements.includes('LAVA_COMBO'), true);

g = game();
const idleKing = g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
g.activeContract = { id: 'VANGUARD_3', status: 'ACTIVE', progress: 0, target: 3 };
g.lavaTiles = [{ x: 2, y: 2 }];
const lavaVictim = g.spawnPiece('PAWN', 'ENEMY', 2, 2, 1, 1, 'N');
g.resolveTileHazardAfterStep(lavaVictim, 2, 3);
assert.equal(idleKing.kills, 0);
assert.equal(g.activeContract.progress, 0);
assert.equal(g.pieces.includes(lavaVictim), false);
const pushedVictim = g.spawnPiece('PAWN', 'ENEMY', 2, 2, 1, 1, 'N');
g.resolveTileHazardAfterStep(pushedVictim, 2, 3, true, idleKing);
assert.equal(idleKing.kills, 1);
assert.equal(g.activeContract.progress, 1);

assert.equal(html.includes('addTestSoulGems'), false);
assert.equal(context.window.Game.prototype.addTestSoulGems, undefined);
console.log('PASS: warrior achievement, environmental kill attribution, pushed kill credit, test currency removal');

const savedValues = new Map();
context.localStorage.setItem = (key, value) => savedValues.set(key, value);
context.localStorage.getItem = key => savedValues.get(key);
context.localStorage.removeItem = key => savedValues.delete(key);
g = game();
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
Object.assign(g, {
    chapter: 10, wave: 10, phase: 'HQ', pendingScreen: 'CHAPTER',
    isBossWave: true, waveSpawnedCount: 24, waveTotalEnemies: 24,
    soulGems: 321,
});
g.saveActiveRunState();
assert.ok(g.getSavedRunState());
g.startNextChapter();
assert.equal(g.getSavedRunState(), null);
assert.equal(g.chapter, 1);
assert.equal(g.wave, 1);
assert.equal(g.phase, 'MENU');
assert.equal(g.isBossWave, false);
assert.equal(g.pieces.length, 0);
assert.equal(g.soulGems, 321);
g.openSplashMenu();
assert.equal(g.getSavedRunState(), null);
g.resizeCanvas = () => {};
g.startNewGameFromSplash();
const freshRun = g.getSavedRunState();
assert.equal(freshRun.chapter, 1);
assert.equal(freshRun.wave, 1);
assert.equal(freshRun.phase, 'PLAYER');
assert.equal(freshRun.isBossWave, false);
assert.ok(freshRun.pieces.some(piece => piece.type === 'KING' && piece.team === 'ALLY'));

g = game();
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
g.wave = 10;
g.phase = 'HQ';
g.startNextChapter();
assert.equal(g.chapter, 2);
assert.equal(g.wave, 1);
assert.equal(g.phase, 'PLAYER');
assert.ok(g.getSavedRunState());
// Double-click guard: calling startNextChapter again while in PLAYER phase must not skip to chapter 3
g.startNextChapter();
assert.equal(g.chapter, 2);
// No double-spawn on chapter transition: setupWave(1, false) + startPlayerTurn(true) spawns once
assert.ok(g.waveSpawnedCount <= g.getBaseTurnQuota() + 2, `expected single initial spawn, got ${g.waveSpawnedCount}`);
console.log('PASS: campaign completion clears save, fresh campaign starts at 1/1, chapter progression preserved');

// 4. Regression tests for audit fixes
g = game();
g.phase = 'PLAYER';
const ramRook = g.spawnPiece('ROOK', 'ALLY', 5, 5, 10, 1, 'N');
ramRook.promotionClass = 'BATTERING_RAM';
const webbed = g.spawnPiece('PAWN', 'ENEMY', 5, 4, 4, 2, 'S', 'WEBBED_PAWN');
g.lavaTiles = [{ x: 5, y: 3 }];
g.performCombatAttack(ramRook, webbed);
assert.ok(!g.pieces.includes(webbed), 'battering ram push into lava should kill webbed pawn');
assert.equal(ramRook.isWebbed, false, 'dead webbed pawn must not web attacker');

g = game();
const spearman = g.spawnPiece('PAWN', 'ALLY', 5, 5, 6, 2, 'N');
spearman.promotionClass = 'SPEARMAN';
g.rocks = [{ x: 6, y: 6 }];
assert.equal(g.doesWatcherGuard(spearman, 7, 7), false, 'spearman must not guard through a rock');
g.rocks = [];
assert.equal(g.doesWatcherGuard(spearman, 7, 7), true, 'spearman guards clear 2-tile diagonal');

g = game();
g.phase = 'HQ';
g.gold = 100;
const fullKing = g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
g.hqHealAll();
assert.equal(g.gold, 100, 'hqHealAll must not charge gold when all allies are at full HP');
fullKing.hp = 10;
g.hqHealAll();
assert.equal(g.gold, 60, 'hqHealAll charges 40 gold when an ally is injured');
assert.equal(fullKing.hp, 20, 'hqHealAll restores full HP');
g.phase = 'PLAYER';
fullKing.hp = 10;
g.hqHealAll();
assert.equal(g.gold, 60, 'hqHealAll must not run outside HQ phase');

g = game();
g.phase = 'HQ';
g.wave = 2;
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
g.startNextWaveFromHQ();
assert.equal(g.wave, 3);
assert.equal(g.phase, 'PLAYER');
g.startNextWaveFromHQ();
assert.equal(g.wave, 3, 'startNextWaveFromHQ double-click guard must prevent skipping wave');

g = game();
g.phase = 'HQ';
g.pendingScreen = 'DECREE';
g.currentDecreeChoices = [{ id: 'SACRED_BLESSING' }];
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
g.iceTiles = [];
g.lavaTiles = [];
for (let x = 1; x < 10; x++) {
  for (let y = 1; y < 10; y++) {
    if ((x === 5 && y === 5) || (x === 2 && y === 2) || (x === 3 && y === 3)) continue;
    g.lavaTiles.push({ x, y });
  }
}
g.sacredTiles = [];
g.applyRoyalDecree('SACRED_BLESSING');
assert.equal(g.sacredTiles.length, 2);
assert.ok(g.sacredTiles.every(t => !g.isLavaAt(t.x, t.y) && !g.isIceAt(t.x, t.y)), 'SACRED_BLESSING must avoid ice and lava tiles');

g = game();
g.phase = 'PLAYER';
g.selectedKingClass = 'MAGE';
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
const deadEnemy = g.spawnPiece('PAWN', 'ENEMY', 5, 4, 4, 2, 'S');
g.selectedPiece = deadEnemy;
g.pieces = g.pieces.filter(p => p.id !== deadEnemy.id);
g.useCommanderSkill('primary');
assert.equal(g.commanderSkills.primaryUsed, false, 'MAGE primary must not consume charge on removed enemy');

console.log('PASS: audit fixes (battering ram lava kill, spearman guard, HQ heal/wave guards, sacred tile placement, stale selection)');

// 5. Regression tests for guide-vs-code mechanics fixes
g = game();
g.phase = 'PLAYER';
g.talents.war_3 = true;
const critKnight = g.spawnPiece('KNIGHT', 'ALLY', 5, 6, 8, 2, 'N');
critKnight.hasKingCritAura = true;
const armoredEnemy = g.spawnPiece('ROOK', 'ENEMY', 6, 4, 20, 2, 'S');
armoredEnemy.permanentArmor = 10;
g.performCombatAttack(critKnight, armoredEnemy);
assert.equal(armoredEnemy.hp, 17, 'war_3 +2 true damage must bypass armor (1 min base + 2 true = 3)');

g = game();
g.phase = 'PLAYER';
g.selectedKingClass = 'MAGE';
g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
const darkKing = g.spawnPiece('KING', 'ENEMY', 5, 2, 20, 3, 'S', 'DARK_KING');
g.selectedPiece = darkKing;
const beforeCount = g.pieces.filter(p => p.team === 'ENEMY').length;
g.useCommanderSkill('primary');
assert.equal(darkKing.hp, 14);
assert.equal(g.pieces.filter(p => p.team === 'ENEMY').length, beforeCount + 1, 'DARK_KING on-damage passive must trigger on MAGE lightning');

g = game();
g.phase = 'ENEMY';
g.talents.def_4 = true;
const savedKing = g.spawnPiece('KING', 'ALLY', 5, 5, 2, 2, 'N');
const enemyRook = g.spawnPiece('ROOK', 'ENEMY', 5, 1, 10, 5, 'S');
g.performCombatAttack(enemyRook, savedKing);
assert.equal(savedKing.hp, 6, 'def_4 must save king at 6 HP');
assert.equal(enemyRook.x, 5);
assert.equal(enemyRook.y, 4, 'attacker must bounce to adjacent square after def_4 save');

g = game();
g.phase = 'PLAYER';
const wildKnight = g.spawnPiece('KNIGHT', 'ALLY', 5, 5, 8, 2, 'N');
wildKnight.promotionClass = 'WILD_CAVALRY';
const midEnemy = g.spawnPiece('PAWN', 'ENEMY', 6, 4, 4, 2, 'S');
const targetEnemy = g.spawnPiece('PAWN', 'ENEMY', 6, 3, 10, 2, 'S');
g.performCombatAttack(wildKnight, targetEnemy);
assert.equal(midEnemy.hp, 3, 'WILD_CAVALRY must deal 1 trample damage during L-attack');

g = game();
g.phase = 'PLAYER';
g.selectedKingClass = 'DEFENDER';
const defKing = g.spawnPiece('KING', 'ALLY', 5, 5, 20, 2, 'N');
g.useCommanderSkill('primary');
assert.equal(g.commanderSkills.primaryUsed, false, 'DEFENDER heal must not waste skill at full HP');
defKing.hp = 15;
g.useCommanderSkill('primary');
assert.equal(g.commanderSkills.primaryUsed, true);
assert.equal(defKing.hp, 19);

g = game();
g.phase = 'HQ';
g.pendingScreen = 'DECREE';
g.currentDecreeChoices = [{ id: 'ROYAL_DRILL' }];
const readyAlly = g.spawnPiece('PAWN', 'ALLY', 5, 6, 6, 2, 'N');
readyAlly.promotionReady = true;
const freshAlly = g.spawnPiece('KNIGHT', 'ALLY', 4, 5, 6, 2, 'N');
g.applyRoyalDecree('ROYAL_DRILL');
assert.equal(freshAlly.promotionReady, true, 'ROYAL_DRILL must pick an ally that is not already promotionReady');

console.log('PASS: guide-vs-code fixes (war_3 true damage, boss passives, def_4 bounce, wild cavalry attack trample, defender heal guard, royal drill)');
