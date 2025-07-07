// 필요한 라이브러리들을 불러옵니다.
const express = require('express');
const request = require('request');
const cors = require('cors');
const axios = require('axios'); // 웹페이지 내용을 가져오기 위해 추가
const cheerio = require('cheerio'); // HTML에서 원하는 정보만 골라내기 위해 추가

const app = express();
app.use(cors());

const clientId = 'rpCe23Hq0Uqu9PdQzKhf';
const clientSecret = 'cWzcufKgEe';

// 헬스 체크를 위한 루트 경로
app.get('/', (req, res) => {
    res.send('Server is healthy and running!');
});

// 기존 뉴스 목록을 가져오는 기능
app.get('/search/news', (req, res) => {
    const query = req.query.query || '정치';
    const api_url = 'https://openapi.naver.com/v1/search/news.json?query=' + encodeURI(query) + '&display=30&sort=sim'; // 더 많은 기사를 가져오도록 수정

    const options = {
        url: api_url,
        headers: {'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret}
    };

    request.get(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
            res.end(body);
        } else {
            res.status(response.statusCode).end();
        }
    });
});

// --- ⭐️ 새로 추가된 웹 스크레이핑 기능 ⭐️ ---
app.get('/scrape', async (req, res) => {
    const { url } = req.query; // 앱에서 분석할 기사의 URL을 받음

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        // 1. axios로 해당 URL의 HTML 페이지를 통째로 가져옴
        const { data } = await axios.get(url);

        // 2. cheerio로 HTML을 분석하기 쉽게 만듦
        const $ = cheerio.load(data);

        // 3. 기사 본문이 들어있는 영역을 선택 (언론사마다 다를 수 있음)
        //    일반적으로 많이 쓰이는 선택자들을 순서대로 시도합니다.
        let articleText = 
            $('div#article-body-contents').text() || 
            $('div#dic_area').text() ||
            $('div.article_body').text() ||
            $('div.article-veiw-body').text() ||
            $('article').text();

        // 4. 불필요한 공백과 줄바꿈을 정리
        articleText = articleText.replace(/\s\s+/g, ' ').trim();

        // 5. 추출한 텍스트를 앱으로 전송
        res.json({ text: articleText });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).send('Failed to scrape the article');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
