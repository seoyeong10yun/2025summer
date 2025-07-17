# pip install pymupdf openai python-dotenv
import os, fitz
from openai import OpenAI
from dotenv import load_dotenv

# ============================================================
# 외부 호출을 위한 공개 서비스 함수
# ============================================================

def generate_data_summary(pdf_path: str = None) -> str:
    if pdf_path is None:
        pdf_path = os.getenv("SOURCE_PDF_PATH")

    keyword_list = [
        "전국 주요관광지표",
        "소셜미디어 언급량",
        "경남 방문자 현황 1",
        "경남 방문자 현황 2",
        "방문자 거주지 분포 비율",
        "외국인 국가별 방문비율",
        "식음료, 숙박, 쇼핑몰, 백화점, 일부 교통시설을 제외한"
    ]
    extracted_pdf_path = os.getenv("EXTRACTED_DATA_PDF_PATH")

    _extract_pages_by_keywords(
        pdf_path,
        extracted_pdf_path,
        keyword_list
    )
    file_id = _upload_pdf(extracted_pdf_path)

    return _call_gpt(
        file_id,
        _data_summarize_prompt,
        model=os.getenv("GPT_MODEL_1")
    )


def generate_issue_summary(pdf_path: str = None) -> str:
    if pdf_path is None:
        pdf_path = os.getenv("SOURCE_PDF_PATH")
    
    keyword_list = ["기사 보러가기"]
    extracted_pdf_path = os.getenv("EXTRACTED_ISSUE_PDF_PATH")

    _extract_pages_by_keywords(
        pdf_path,
        extracted_pdf_path,
        keyword_list
    )
    file_id = _upload_pdf(extracted_pdf_path)

    return _call_gpt(
        file_id,
        _issue_summarize_prompt,
        model=os.getenv("GPT_MODEL_2")
    )


# ============================================================
# 내부 헬퍼 함수
# ============================================================

def _load_prompt(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _upload_pdf(file_path) -> str:
    with open(file_path, "rb") as pdf_file:
        response = _client.files.create(
            file=pdf_file,
            purpose="assistants"
        )
    return response.id


def _call_gpt(file_id: str, prompt: str, model: str) -> str:
    response = _client.responses.create(
        model=model,
        temperature=float(os.getenv("OPENAI_TEMPERATURE")),
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_file", "file_id": file_id},
                    {"type": "input_text", "text": prompt}
                ]
            }
        ]
    )
    return response.output_text


def _extract_pages_by_keywords(
    input_pdf_path: str, output_pdf_path: str, keyword_list: list
) -> None:
    input_pdf = fitz.open(input_pdf_path)
    output_pdf = fitz.open()
    selected_pages = set()

    for page_num in range(len(input_pdf)):
        page = input_pdf[page_num]
        page_text = page.get_text()
        for keyword in keyword_list:
            if keyword in page_text:
                selected_pages.add(page_num)

    for page_num in sorted(selected_pages):
        output_pdf.insert_pdf(
            input_pdf, from_page=page_num, to_page=page_num
        )

    output_pdf.save(output_pdf_path)
    output_pdf.close()
    input_pdf.close()


# ============================================================
# 환경변수 및 프롬프트 로드, OpenAI 클라이언트 설정
# ============================================================

load_dotenv()

_data_summarize_prompt = _load_prompt(os.getenv("DATA_SUMMARIZE_PROMPT_PATH"))
_issue_summarize_prompt = _load_prompt(os.getenv("ISSUE_SUMMARIZE_PROMPT_PATH"))

_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    #base_url=os.getenv("OPENAI_API_BASE"),
    timeout=int(os.getenv("OPENAI_TIMEOUT"))
)
