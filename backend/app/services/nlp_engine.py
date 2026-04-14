"""
services/nlp_engine.py — NLP pipeline using spaCy.

Extracts:
  - Skills (matched against a large tech-skills vocabulary)
  - Education (degree mentions via regex)
  - Years of experience (regex)
  - Keywords (top TF-IDF-style terms from resume text)
"""

import re
import math
import spacy
from collections import Counter
from typing import List, Tuple

# ── Load spaCy model (small English model) ─────────────────────────────────────
# Run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Graceful degradation if model isn't downloaded yet
    nlp = None
    print("[NLP] WARNING: spaCy model 'en_core_web_sm' not found. Run: python -m spacy download en_core_web_sm")


# ── Curated Tech Skills Vocabulary ────────────────────────────────────────────
TECH_SKILLS = {
    # Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "r", "matlab", "perl",
    # Web Frameworks
    "react", "angular", "vue", "nextjs", "fastapi", "flask", "django",
    "express", "spring", "laravel", "rails", "nodejs", "nestjs",
    # Databases
    "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "oracle", "mssql", "firebase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "ci/cd", "linux", "bash", "nginx",
    # Data & ML
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn", "nlp",
    "computer vision", "data science", "spark", "hadoop", "tableau", "powerbi",
    # Other
    "git", "rest api", "graphql", "microservices", "agile", "scrum",
    "html", "css", "tailwind", "sass", "webpack", "vite",
    "spacy", "huggingface", "transformers", "openai", "langchain",
    "excel", "jira", "confluence",
}

# ── Education Degree Patterns ─────────────────────────────────────────────────
EDUCATION_PATTERNS = [
    r"\b(b\.?tech|bachelor of technology|b\.?e\.?|bachelor of engineering)\b",
    r"\b(m\.?tech|master of technology|m\.?e\.?|master of engineering)\b",
    r"\b(b\.?sc|bachelor of science|b\.?s\.?)\b",
    r"\b(m\.?sc|master of science|m\.?s\.?)\b",
    r"\b(b\.?a\.?|bachelor of arts)\b",
    r"\b(m\.?a\.?|master of arts)\b",
    r"\b(mba|master of business administration)\b",
    r"\b(ph\.?d|doctorate|doctor of philosophy)\b",
    r"\b(b\.?c\.?a\.?|bachelor of computer applications)\b",
    r"\b(m\.?c\.?a\.?|master of computer applications)\b",
    r"\b(diploma|associate degree)\b",
]

# ── Experience Patterns ───────────────────────────────────────────────────────
EXPERIENCE_PATTERNS = [
    r"(\d+(?:\.\d+)?)\s*\+?\s*years?\s*(?:of\s+)?(?:experience|exp)",
    r"experience\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*\+?\s*years?",
    r"(\d+(?:\.\d+)?)\s*\+?\s*yrs?\s*(?:of\s+)?(?:experience|exp)",
    r"worked\s+for\s+(\d+(?:\.\d+)?)\s*\+?\s*years?",
]


def extract_skills(text: str) -> List[str]:
    """
    Match skills from resume text against the tech skills vocabulary.
    Uses case-insensitive whole-word matching.

    Args:
        text: Raw resume text.

    Returns:
        Sorted list of matched skills.
    """
    text_lower = text.lower()
    found = set()
    for skill in TECH_SKILLS:
        # Use word-boundary matching for single-word skills
        if " " in skill:
            if skill in text_lower:
                found.add(skill.title())
        else:
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, text_lower):
                found.add(skill.title())
    return sorted(found)


def extract_education(text: str) -> str:
    """
    Extract the highest degree mentioned in the resume.

    Args:
        text: Raw resume text.

    Returns:
        Comma-separated string of found degrees.
    """
    text_lower = text.lower()
    found = []
    for pattern in EDUCATION_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            found.append(match.group(0).strip().upper())
    return ", ".join(dict.fromkeys(found)) if found else "Not specified"


def extract_experience_years(text: str) -> float:
    """
    Extract the maximum years of experience mentioned in the resume.

    Args:
        text: Raw resume text.

    Returns:
        Float representing years of experience (0.0 if not found).
    """
    found_years = []
    for pattern in EXPERIENCE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            try:
                found_years.append(float(match.group(1)))
            except (IndexError, ValueError):
                pass
    return max(found_years) if found_years else 0.0


def extract_keywords(text: str, top_n: int = 30) -> List[str]:
    """
    Extract top N meaningful keywords using TF-style frequency + spaCy POS filtering.
    Falls back to simple word frequency if spaCy model isn't loaded.

    Args:
        text: Raw resume text.
        top_n: Number of top keywords to return.

    Returns:
        List of top keyword strings.
    """
    STOP_WORDS = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "i", "my", "we", "our", "you", "your",
        "he", "she", "it", "they", "their", "this", "that", "these", "those",
        "as", "so", "if", "then", "than", "more", "most", "also", "such",
        "all", "any", "each", "both", "few", "more", "other", "some", "into",
        "through", "during", "including", "without", "within", "about", "between",
        "experience", "work", "worked", "working", "ability", "knowledge",
        "strong", "good", "excellent", "team", "company",
    }

    if nlp is not None:
        doc = nlp(text[:500000])  # cap to avoid memory issues
        tokens = [
            token.lemma_.lower()
            for token in doc
            if token.pos_ in ("NOUN", "PROPN", "ADJ")
            and not token.is_stop
            and not token.is_punct
            and len(token.text) > 2
            and token.lemma_.lower() not in STOP_WORDS
        ]
    else:
        # Fallback: simple tokenization
        tokens = [
            w.lower()
            for w in re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#.]{2,}\b", text)
            if w.lower() not in STOP_WORDS
        ]

    counter = Counter(tokens)
    return [word for word, _ in counter.most_common(top_n)]


def parse_resume(raw_text: str) -> dict:
    """
    Full NLP pipeline: parse a resume's raw text and return structured data.

    Args:
        raw_text: Full extracted text from a resume file.

    Returns:
        Dict with keys: skills, education, experience_years, keywords
    """
    return {
        "skills": extract_skills(raw_text),
        "education": extract_education(raw_text),
        "experience_years": extract_experience_years(raw_text),
        "keywords": extract_keywords(raw_text),
    }


def compute_skill_score(candidate_skills: List[str], required_skills: List[str]) -> float:
    """
    Compute skill match score as a percentage.

    Args:
        candidate_skills: Skills extracted from the resume.
        required_skills: Skills required by the job posting.

    Returns:
        Float 0–100 representing the match percentage.
    """
    if not required_skills:
        return 50.0  # neutral score if job specifies no skills
    candidate_set = {s.lower() for s in candidate_skills}
    required_set = {s.lower() for s in required_skills}
    matched = candidate_set.intersection(required_set)
    return round((len(matched) / len(required_set)) * 100, 2)


def compute_experience_score(candidate_years: float, required_level: str) -> float:
    """
    Score the candidate's experience against the job's required experience level.

    Level to years mapping:
      "0-1 years" / "Entry"     → expects 0–1
      "1-3 years" / "Junior"    → expects 1–3
      "2-4 years" / "Mid"       → expects 2–4
      "4-6 years" / "Senior"    → expects 4–6
      "5+ years"  / "Lead"      → expects 5+

    Args:
        candidate_years: Extracted years from resume.
        required_level: Job posting experience_level string.

    Returns:
        Float 0–100.
    """
    level_lower = required_level.lower()

    # Map level to (min_years, ideal_years, max_penalty_years)
    if any(x in level_lower for x in ["entry", "0-1", "fresher", "intern"]):
        min_y, ideal_y = 0, 1
    elif any(x in level_lower for x in ["junior", "1-2", "1-3"]):
        min_y, ideal_y = 1, 2
    elif any(x in level_lower for x in ["mid", "2-4", "2-3", "intermediate"]):
        min_y, ideal_y = 2, 4
    elif any(x in level_lower for x in ["senior", "4-6", "4-5", "5-7"]):
        min_y, ideal_y = 4, 6
    elif any(x in level_lower for x in ["lead", "principal", "5+", "7+", "10+"]):
        min_y, ideal_y = 5, 100  # more is better
    else:
        # Try to parse numeric from string e.g. "3 years"
        nums = re.findall(r"\d+", required_level)
        if nums:
            min_y, ideal_y = 0, int(nums[-1])
        else:
            return 50.0  # neutral

    if candidate_years >= ideal_y:
        return 100.0
    elif candidate_years >= min_y:
        # Linear interpolation between min and ideal
        return round(50 + 50 * (candidate_years - min_y) / max(ideal_y - min_y, 0.1), 2)
    else:
        # Penalty for under-qualification
        return round(max(0, 50 * (candidate_years / max(min_y, 0.1))), 2)


def compute_education_score(candidate_education: str, required_education: str) -> float:
    """
    Score education match. Compares degree level hierarchy.

    Args:
        candidate_education: Education string from resume.
        required_education: Education requirement from job posting.

    Returns:
        Float 0–100.
    """
    if not required_education or required_education.lower() in ("not specified", "", "any"):
        return 75.0  # no specific requirement — partial credit

    # Degree hierarchy (higher index = higher degree)
    hierarchy = ["diploma", "b.sc", "b.a", "bca", "b.tech", "b.e", "mca",
                 "m.sc", "m.a", "mba", "m.tech", "m.e", "ph.d"]

    def degree_level(text: str) -> int:
        text_l = text.lower()
        for i, deg in enumerate(hierarchy):
            if deg in text_l:
                return i
        return -1

    candidate_level = degree_level(candidate_education)
    required_level = degree_level(required_education)

    if candidate_level == -1:
        return 30.0  # couldn't determine candidate degree
    if required_level == -1:
        return 60.0  # couldn't determine requirement

    if candidate_level >= required_level:
        return 100.0
    else:
        # Partial score based on closeness
        diff = required_level - candidate_level
        return round(max(0, 100 - diff * 20), 2)


def compute_keyword_score(resume_text: str, job_description: str) -> float:
    """
    Score keyword overlap between resume and job description using
    a simple TF-IDF-style Jaccard similarity.

    Args:
        resume_text: Full raw text from resume.
        job_description: Job description from posting.

    Returns:
        Float 0–100.
    """
    def tokenize(text: str):
        words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#]{2,}\b", text.lower())
        stopwords = {
            "the", "and", "for", "with", "that", "this", "are", "has", "have",
            "will", "you", "our", "your", "from", "able", "also", "their",
            "strong", "good", "must", "work", "team", "looking", "join"
        }
        return {w for w in words if w not in stopwords}

    resume_tokens = tokenize(resume_text)
    job_tokens = tokenize(job_description)

    if not job_tokens:
        return 50.0

    intersection = resume_tokens & job_tokens
    union = resume_tokens | job_tokens
    jaccard = len(intersection) / len(union) if union else 0

    # Scale Jaccard (typically 0.05–0.30 for good matches) to 0–100
    return round(min(100.0, jaccard * 400), 2)
