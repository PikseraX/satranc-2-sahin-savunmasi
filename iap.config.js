// Merkezi Uygulama İçi Satın Alma (IAP) Ürün Kataloğu (Google Play & Apple App Store)
// Google Play Console ve App Store Connect'te bu ürün kimliklerini aynı adlarla oluşturun.

const IAP_PRODUCTS = {
  remove_ads: {
    id: 'satranc2_reklamlari_kaldir',
    type: 'non-consumable',
    isConsumable: false,
    soulGemsAmount: 0,
    title: 'Reklamları Kaldır',
  },
  sg_200: {
    id: 'satranc2_ruh_tasi_200',
    type: 'consumable',
    isConsumable: true,
    soulGemsAmount: 200,
    title: '+200 Ruh Taşı',
  },
  sg_500: {
    id: 'satranc2_ruh_tasi_500',
    type: 'consumable',
    isConsumable: true,
    soulGemsAmount: 500,
    title: '+500 Ruh Taşı',
  },
  sg_1250: {
    id: 'satranc2_ruh_tasi_1250',
    type: 'consumable',
    isConsumable: true,
    soulGemsAmount: 1250,
    title: '+1.250 Ruh Taşı',
  },
  sg_3000: {
    id: 'satranc2_ruh_tasi_3000',
    type: 'consumable',
    isConsumable: true,
    soulGemsAmount: 3000,
    title: '+3.000 Ruh Taşı',
  },
};

const IAP_SKUS = Object.values(IAP_PRODUCTS).map(p => p.id);

function findIapProductById(productId) {
  return Object.values(IAP_PRODUCTS).find(p => p.id === productId) || null;
}

module.exports = { IAP_PRODUCTS, IAP_SKUS, findIapProductById };
