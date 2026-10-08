# HEHKU — Hiljaisuuden puutarha

Rauhallinen selainpeli: kerää levottomat valonsäikeet pitämällä hengityspainiketta pohjassa ja vapauta ne kukiksi. Ei aikapainetta, ei epäonnistumista, ei väärää tapaa pelata.

## ✨ Ominaisuudet

- **6 etenevää puutarhaa** — Aamukasteesta Sisäiseen aurinkoon, jokaisella oma värimaailma ja mekaniikka
- **Kaksikielinen käyttöliittymä (FI / EN)** — kielivalitsin aloitusnäytössä, valinta tallentuu
- **Hengitysmekaniikka** — pidä pohjassa (sisäänhengitys kerää valosäikeitä), vapauta (istuttaa kukat)
- **Tyyneyspulssi** (puutarhat 3+) — rauhoita läheiset säikeet `E`-näppäimellä
- **Kaikki proseduraalista** — taustat, kukat, valosolmut ja Web Audio -äänimaisema generoidaan koodissa, ei ulkoisia assetteja
- **Saavutettavuusominaisuudet** — näppäimistöohjaus, ARIA-tiedotteet, dialogien sisälle rajattu fokus ja rauhallisemman liikkeen asetus, joka pysäyttää koristeanimaatiot ja poistaa hiukkas- ja rengastehosteet. Pelin liikkuminen säilyy käytössä. Kattavaa saavutettavuusauditointia ei ole tehty.
- **Paikallinen tallennus** — avatut puutarhat, kieli, äänet ja liikeasetukset vain `localStorage`:ssa; tallennuksen ollessa estetty peli toimii ja asetukset säilyvät nykyisen istunnon ajan

## 🚀 Käynnistys

Vaatii **Node.js 20.19+ tai 22.12+** -version (suosituksena tuettu LTS-versio).

Windowsissa kaksoisklikkaa **`start-dev.bat`** — se asentaa riippuvuudet tarvittaessa, käynnistää dev-serverin ja avaa pelin selaimessa. Komentoriviä ei tarvita.

Tai manuaalisesti:

```bash
npm ci
npm run dev      # → http://localhost:5173
```

Muut komennot:

```bash
npm run build    # tyyppitarkistus + tuotantobuild → dist/
npm run preview  # tarjoile tuotantobuild paikallisesti
```

Tai kaksoisklikkaa **`start-preview.bat`** tuotantoversion rakentamiseen ja esikatseluun.


<img width="1900" height="954" alt="image" src="https://github.com/user-attachments/assets/0ee60fd7-3718-455e-a682-bfb6720539e6" />
<img width="1916" height="949" alt="image" src="https://github.com/user-attachments/assets/0bb0b4ad-3f44-4c27-858a-3d74a1c17cdb" />
