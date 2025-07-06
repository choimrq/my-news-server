// 필요한 라이브러리들을 불러옵니다.
const express = require('express');
const request = require('request');
const cors = require('cors'); // 다른 웹사이트에서의 요청을 허용해주는 라이브러리

const app = express();

// CORS 설정: 모든 곳에서의 요청을 허용합니다. (개발용)
app.use(cors()); 

// 네이버 개발자 센터에서 발급받은 키를 여기에 입력합니다.
const clientId = 'rpCe23Hq0Uqu9PdQzKhf';
const clientSecret = 'cWzcufKgEe';

// '/search/news' 라는 주소로 요청이 오면, 네이버에 뉴스를 검색하여 결과를 전달합니다.
app.get('/search/news', (req, res) => {
    // 클라이언트에서 'query' 파라미터로 검색어를 받거나, 없으면 '정치'를 기본값으로 사용합니다.
    const query = req.query.query || '정치'; 
    const api_url = 'https://openapi.naver.com/v1/search/news.json?query=' + encodeURI(query) + '&display=20&sort=sim'; // 20개, 유사도순 정렬

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

// 3000번 포트에서 서버를 실행합니다. Render에서는 자동으로 포트를 설정해줍니다.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));