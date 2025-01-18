import PyPDF2
import pytesseract
from PIL import Image
import re
from dateutil import parser
from datetime import datetime, timedelta
import io
import os
import logging
import pdfplumber
import docx2txt

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class DateExtractor:
    def __init__(self):
        self.date_patterns = [
            # First priority - expiry related dates
            r'(?i)expires?:?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',
            r'(?i)expiry\s*date:?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',
            r'(?i)valid\s*until:?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',
            r'(?i)exp\.?\s*date:?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',
            # Second priority - normal dates
            r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',  # 01/01/2024, 1-1-24
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',    # 2024/01/01
            r'(?i)\d{1,2}\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{2,4}',
            r'(?i)(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{1,2},?\s\d{2,4}'
        ]

    def _extract_dates_from_text(self, text):
        logger.info(f"Analyzing text for dates: {text[:200]}...")  # Log first 200 chars
        potential_dates = []
        
        for pattern in self.date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                date_str = match.group()
                logger.info(f"Found potential date string: {date_str}")
                date_str = re.sub(r'(?i)expires?:?\s*|expiry\s*date:?\s*|valid\s*until:?\s*|exp\.?\s*date:?\s*', '', date_str)
                try:
                    parsed_date = parser.parse(date_str, fuzzy=True)
                    logger.info(f"Successfully parsed date: {parsed_date}")
                    potential_dates.append(parsed_date)
                except Exception as e:
                    logger.warning(f"Failed to parse date string '{date_str}': {str(e)}")
                    continue

        logger.info(f"Found {len(potential_dates)} potential dates: {potential_dates}")
        
        potential_dates.sort(reverse=True)
        if potential_dates:
            logger.info(f"Selected most recent date: {potential_dates[0]}")
            return potential_dates[0]
        logger.warning("No valid dates found")
        return None

    def extract_from_pdf(self, file_bytes):
        try:
            logger.info("Starting PDF text extraction")
            text = ""
            
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        logger.info(f"Extracted text from page using pdfplumber: {page_text[:200]}...")
                        text += page_text
            except Exception as e:
                logger.warning(f"pdfplumber failed: {e}, trying PyPDF2")
                with io.BytesIO(file_bytes) as file:
                    reader = PyPDF2.PdfReader(file)
                    for i, page in enumerate(reader.pages):
                        page_text = page.extract_text() or ""
                        logger.info(f"Extracted text from page {i+1} using PyPDF2: {page_text[:200]}...")
                        text += page_text
            
            if not text.strip():
                logger.warning("No text extracted from PDF, trying OCR")
                image = self.convert_pdf_to_image(file_bytes)
                text = pytesseract.image_to_string(image)
                
            if not text.strip():
                logger.error("Failed to extract any text from PDF")
                return None
                    
            logger.info("Attempting to extract date from PDF text")
            return self._extract_dates_from_text(text)
        except Exception as e:
            logger.error(f"Error extracting date from PDF: {str(e)}")
            return None

    def extract_from_image(self, file_bytes):
        try:
            logger.info("Starting image text extraction using OCR")
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            
            if not text.strip():
                logger.error("Failed to extract any text from image")
                return None

            logger.info("Attempting to extract date from image text")    
            return self._extract_dates_from_text(text)
        except Exception as e:
            logger.error(f"Error extracting date from image: {str(e)}")
            return None

    def extract_from_doc(self, file_bytes):
        try:
            logger.info("Starting .doc/.docx text extraction")
            text = docx2txt.process(io.BytesIO(file_bytes))
            
            if not text.strip():
                logger.error("Failed to extract any text from .doc/.docx")
                return None
                
            logger.info("Attempting to extract date from .doc/.docx text")
            return self._extract_dates_from_text(text)
        except Exception as e:
            logger.error(f"Error extracting date from .doc/.docx: {str(e)}")
            return None

    @staticmethod
    def convert_pdf_to_image(file_bytes):
        images = []
        with io.BytesIO(file_bytes) as file:
            reader = PyPDF2.PdfReader(file)
            for i, page in enumerate(reader.pages):
                logger.info(f"Converting page {i+1} to image")
                page_image = page.to_image(resolution=200)
                images.append(page_image.original.convert('RGB'))
        if images:
            widths, heights = zip(*(i.size for i in images))
            max_width = max(widths)
            total_height = sum(heights)
            combined_image = Image.new('RGB', (max_width, total_height))
            offset = 0
            for image in images:
                combined_image.paste(image, (0, offset))
                offset += image.size[1]
            buffer = io.BytesIO()
            combined_image.save(buffer, format="PNG")
            image_bytes = buffer.getvalue()
            return Image.open(io.BytesIO(image_bytes))
        return None

    def extract_date(self, file_bytes, filename):
        """Main method to extract date from a file"""
        logger.info(f"Processing file: {filename}")
        _, extension = os.path.splitext(filename)
        extension = extension.lower()
        
        if extension == '.pdf':
            return self.extract_from_pdf(file_bytes)
        elif extension in ['.png', '.jpg', '.jpeg']:
            return self.extract_from_image(file_bytes)
        elif extension in ['.doc', '.docx']:
            return self.extract_from_doc(file_bytes)
        else:
            logger.warning(f"Unsupported file extension: {extension}")
            return None