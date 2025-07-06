// 필요한 라이브러리들을 불러옵니다.
const express = require('express');
const request = require('request');
const cors = require('cors');

const app = express();
app.use(cors()); 

const clientId = 'rpCe23Hq0Uqu9PdQzKhf';
const clientSecret = 'cWzcufKgEe';

// --- 여기부터 3줄을 추가해주세요 ---
// 헬스 체크를 위한 루트 경로
app.get('/', (req, res) => {
    res.send('Server is healthy!');
});
// --- 여기까지 추가 ---

// '/search/news' 라는 주소로 요청이 오면, 네이버에 뉴스를 검색하여 결과를 전달합니다.
app.get('/search/news', (req, res) => {
    const query = req.query.query || '정치'; 
    const api_url = 'https://openapi.naver.com/v1/search/news.json?query=' + encodeURI(query) + '&display=20&sort=sim';

    const options = {
        url: api_url,
        headers: {'X-Naver-Client-Id':clientId, 'X-Naver-Client-Secret': clientSecret}
    };

    request.get(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
            res.end(body);
        } else {
            res.status(response.statusCode).end();
            console.log('error = ' + response.statusCode);
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));