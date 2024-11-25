
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios');

const scrapingUrl = 'https://mto.to/chapter'
const firstPage = '856124'
let ANIME = 'Saint Young Men'

const scrapeCapitulos = async (url) => {
  // const browser = await puppeteer.launch()
  const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true, devtools: true });
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 })

  const content = await page.content()
  const $ = cheerio.load(content)

  const inputSelect = $('select').has('optgroup[label="Chapters"]').first()
  const urlCapitulos = []
  
  ANIME = $('h3.nav-title a').text()

  inputSelect.find('option').each((_, element) => {
    const value = $(element).val()
    urlCapitulos.push(`${scrapingUrl}/${value}`)
  })

  const listaTotal = [];
  for (const capitulo of urlCapitulos) {
    const listaUrls = await scrapeWebsite(browser, capitulo);
    listaTotal.push(listaUrls)
    console.log(listaTotal.length + 1)
  }

  await browser.close()
  await scrapingImages(listaTotal.flat())
}

const scrapeWebsite = async (browser, url) => {
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: 'networkidle2' })
  const content = await page.content()
  const $ = cheerio.load(content)

  const urls = []
  $('#viewer div img').each((_, element) => {
    const imgSrc = $(element).attr('src')
    if (imgSrc) {
      const absoluteUrl = new URL(imgSrc, url).href
      urls.push(absoluteUrl)
    }
  })
  
  await page.close()
  return urls
}

const scrapingImages = async (listaUrls) => {

  const anime = ANIME.replace(".", "_");

  try {

    await axios.post('http://localhost:3000/download-images',
      { urls: listaUrls, anime: anime },
      { headers: 
        { 'Content-Type': 'application/json '}
      }
    );

    console.log('Descarga Completa!')

  } catch (err) {
    console.error('Error al enviar las URLs:', err);
  }

}

scrapeCapitulos(`${scrapingUrl}/${firstPage}`)
