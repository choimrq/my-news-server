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

// --- ⭐️ 업그레이드된 웹 스크레이핑 기능 ⭐️ ---
app.get('/scrape', async (req, res) => {
    const { url } = req.query; 

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // 1. 불필요한 요소(스크립트, 스타일, 광고, 헤더, 푸터 등)를 먼저 강력하게 제거
        $('script, style, .ad, .advertisement, #advertisement, .ad-box, #aside_section, .aside_section, header, footer, .header, .footer, #header, #footer, .top-nav, .bottom-nav, .related-news, .news-related, #comment, .comment-area').remove();

        // 2. 기사 본문이 들어있는 가장 유력한 영역을 선택
        let articleBody = 
            $('div#article-body-contents, div#dic_area, div.article_body, div.article-veiw-body, article, section#articleBody');

        // 3. 본문 영역 내에서도 불필요한 자식 요소를 추가로 제거
        articleBody.find('.reporter, .byline, .copyright, .article-info, .function_btns').remove();

        let articleText = articleBody.text();

        // 4. 불필요한 공백과 줄바꿈, 광고성 문구를 정규식으로 정리
        articleText = articleText
            .replace(/(\s{2,})/g, ' ') // 연속된 공백을 하나로
            .replace(/(\n\s*){3,}/g, '\n\n') // 3번 이상의 연속 줄바꿈을 두 번으로
            .replace(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g, '') // 이메일 주소 제거
            .replace(/\[.*?\]/g, '') // [ ] 괄호와 내용 제거 (예: [서울=뉴시스])
            .replace(/【.*?】/g, '') // 【 】 괄호와 내용 제거
            .replace(/\(.*?=.*?\)/g, '') // (서울=연합뉴스) 같은 형식 제거
            .replace(/기자\s*=/g, '')
            .replace(/Copyrights.*All rights reserved/g, '') // 저작권 문구 제거
            .replace(/무단 전재 및 재배포 금지/g, '') // 재배포 금지 문구 제거
            .replace(/ADVERTISEMENT/g, '') // 'ADVERTISEMENT' 단어 제거
            .replace(/많이 본 뉴스/g, '') // '많이 본 뉴스' 문구 제거
            .replace(/이 시각 관심정보/g, '') // '이 시각 관심정보' 문구 제거
            .trim();

        // 5. 추출한 텍스트를 앱으로 전송
        res.json({ text: articleText });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).send('Failed to scrape the article');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));