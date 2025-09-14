"""
Playwright browser automation tools for MCP DevOps Server

This module provides comprehensive browser automation tools using Playwright
for web testing, scraping, and automation tasks.
"""

import asyncio
import base64
from typing import Any, Dict

from .base_tool import BaseTool


class PlaywrightBaseTool(BaseTool):
    """Base class for Playwright tools with common functionality"""

    def __init__(self):
        super().__init__()
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None

    async def _ensure_playwright(self):
        """Ensure Playwright is available and browser is launched"""
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            raise Exception(
                "Playwright not installed. Install with: "
                "pip install playwright && playwright install"
            )

        if self.playwright is None:
            self.playwright = await async_playwright().start()
            # Launch browser (chromium by default)
            self.browser = await self.playwright.chromium.launch(
                headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            self.context = await self.browser.new_context(
                viewport={"width": 1280, "height": 720}
            )
            self.page = await self.context.new_page()

    async def cleanup(self):
        """Clean up Playwright resources"""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()


class PlaywrightNavigate(PlaywrightBaseTool):
    """Navigate to a URL"""

    @property
    def name(self) -> str:
        return "playwright_navigate"

    @property
    def description(self) -> str:
        return "Navigate to a URL in the browser"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to navigate to",
                },
                "wait_until": {
                    "type": "string",
                    "enum": ["load", "domcontentloaded", "networkidle"],
                    "description": "When to consider navigation finished",
                    "default": "load",
                },
                "timeout": {
                    "type": "integer",
                    "description": "Navigation timeout in seconds",
                    "default": 30,
                },
            },
            "required": ["url"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the navigate command"""
        url = arguments["url"]
        wait_until = arguments.get("wait_until", "load")
        timeout = arguments.get("timeout", 30) * 1000  # Convert to ms

        self.logger.info("Navigating to URL", url=url)

        await self._ensure_playwright()

        try:
            response = await self.page.goto(url, wait_until=wait_until, timeout=timeout)

            return {
                "url": self.page.url,
                "title": await self.page.title(),
                "status": response.status if response else None,
                "load_state": await self.page.evaluate("document.readyState"),
            }
        except Exception as e:
            return {
                "error": str(e),
                "url": url,
            }


class PlaywrightTakeScreenshot(PlaywrightBaseTool):
    """Take a screenshot of the current page"""

    @property
    def name(self) -> str:
        return "playwright_take_screenshot"

    @property
    def description(self) -> str:
        return "Take a screenshot of the current page or element"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "full_page": {
                    "type": "boolean",
                    "description": "Whether to take a full page screenshot",
                    "default": False,
                },
                "element_selector": {
                    "type": "string",
                    "description": "CSS selector for element to screenshot",
                },
                "format": {
                    "type": "string",
                    "enum": ["png", "jpeg"],
                    "description": "Image format",
                    "default": "png",
                },
                "quality": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100,
                    "description": "Image quality for JPEG (0-100)",
                    "default": 80,
                },
            },
            "required": [],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the screenshot command"""
        full_page = arguments.get("full_page", False)
        element_selector = arguments.get("element_selector")
        format_type = arguments.get("format", "png")
        quality = arguments.get("quality", 80)

        self.logger.info(
            "Taking screenshot", full_page=full_page, element_selector=element_selector
        )

        await self._ensure_playwright()

        try:
            options = {
                "type": format_type,
                "full_page": full_page,
            }

            if format_type == "jpeg":
                options["quality"] = quality

            if element_selector:
                element = await self.page.locator(element_selector).first
                screenshot_bytes = await element.screenshot(**options)
            else:
                screenshot_bytes = await self.page.screenshot(**options)

            # Convert to base64 for transmission
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode()

            return {
                "screenshot": screenshot_base64,
                "format": format_type,
                "size": len(screenshot_bytes),
                "url": self.page.url,
                "title": await self.page.title(),
            }
        except Exception as e:
            return {
                "error": str(e),
                "url": self.page.url if self.page else None,
            }


class PlaywrightClick(PlaywrightBaseTool):
    """Click on an element"""

    @property
    def name(self) -> str:
        return "playwright_click"

    @property
    def description(self) -> str:
        return "Click on an element using CSS selector or text content"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector for the element to click",
                },
                "text": {
                    "type": "string",
                    "description": "Text content to click on (alternative to selector)",
                },
                "button": {
                    "type": "string",
                    "enum": ["left", "right", "middle"],
                    "description": "Mouse button to click",
                    "default": "left",
                },
                "double_click": {
                    "type": "boolean",
                    "description": "Whether to double-click",
                    "default": False,
                },
                "force": {
                    "type": "boolean",
                    "description": "Whether to force the click (bypass actionability checks)",
                    "default": False,
                },
                "timeout": {
                    "type": "integer",
                    "description": "Timeout in seconds",
                    "default": 30,
                },
            },
            "required": [],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the click command"""
        selector = arguments.get("selector")
        text = arguments.get("text")
        button = arguments.get("button", "left")
        double_click = arguments.get("double_click", False)
        force = arguments.get("force", False)
        timeout = arguments.get("timeout", 30) * 1000

        if not selector and not text:
            raise ValueError("Either 'selector' or 'text' must be provided")

        self.logger.info("Clicking element", selector=selector, text=text)

        await self._ensure_playwright()

        try:
            if text:
                locator = self.page.get_by_text(text)
            else:
                locator = self.page.locator(selector)

            click_options = {
                "button": button,
                "force": force,
                "timeout": timeout,
            }

            if double_click:
                await locator.dblclick(**click_options)
            else:
                await locator.click(**click_options)

            return {
                "success": True,
                "selector": selector,
                "text": text,
                "url": self.page.url,
            }
        except Exception as e:
            return {
                "error": str(e),
                "selector": selector,
                "text": text,
                "url": self.page.url,
            }


class PlaywrightType(PlaywrightBaseTool):
    """Type text into an input field"""

    @property
    def name(self) -> str:
        return "playwright_type"

    @property
    def description(self) -> str:
        return "Type text into an input field or editable element"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector for the input element",
                },
                "text": {
                    "type": "string",
                    "description": "Text to type",
                },
                "delay": {
                    "type": "integer",
                    "description": "Delay between keystrokes in milliseconds",
                    "default": 0,
                },
                "clear": {
                    "type": "boolean",
                    "description": "Whether to clear the field before typing",
                    "default": True,
                },
                "press_enter": {
                    "type": "boolean",
                    "description": "Whether to press Enter after typing",
                    "default": False,
                },
            },
            "required": ["selector", "text"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the type command"""
        selector = arguments["selector"]
        text = arguments["text"]
        delay = arguments.get("delay", 0)
        clear = arguments.get("clear", True)
        press_enter = arguments.get("press_enter", False)

        self.logger.info("Typing text", selector=selector, text_length=len(text))

        await self._ensure_playwright()

        try:
            locator = self.page.locator(selector)

            if clear:
                await locator.clear()

            await locator.type(text, delay=delay)

            if press_enter:
                await locator.press("Enter")

            return {
                "success": True,
                "selector": selector,
                "text_length": len(text),
                "url": self.page.url,
            }
        except Exception as e:
            return {
                "error": str(e),
                "selector": selector,
                "url": self.page.url,
            }


class PlaywrightWaitFor(PlaywrightBaseTool):
    """Wait for element, text, or time"""

    @property
    def name(self) -> str:
        return "playwright_wait_for"

    @property
    def description(self) -> str:
        return "Wait for element to appear/disappear, text to appear/disappear, or specified time"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector to wait for",
                },
                "text": {
                    "type": "string",
                    "description": "Text to wait for",
                },
                "url": {
                    "type": "string",
                    "description": "URL pattern to wait for",
                },
                "time": {
                    "type": "number",
                    "description": "Time to wait in seconds",
                },
                "state": {
                    "type": "string",
                    "enum": ["attached", "detached", "visible", "hidden"],
                    "description": "State to wait for (for elements)",
                    "default": "visible",
                },
                "timeout": {
                    "type": "integer",
                    "description": "Timeout in seconds",
                    "default": 30,
                },
            },
            "required": [],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the wait command"""
        selector = arguments.get("selector")
        text = arguments.get("text")
        url = arguments.get("url")
        time = arguments.get("time")
        state = arguments.get("state", "visible")
        timeout = arguments.get("timeout", 30) * 1000

        if not any([selector, text, url, time]):
            raise ValueError(
                "One of 'selector', 'text', 'url', or 'time' must be provided"
            )

        self.logger.info("Waiting", selector=selector, text=text, url=url, time=time)

        await self._ensure_playwright()

        try:
            if time:
                await asyncio.sleep(time)
                result = {"waited_time": time}
            elif selector:
                await self.page.wait_for_selector(
                    selector, state=state, timeout=timeout
                )
                result = {"selector": selector, "state": state}
            elif text:
                await self.page.wait_for_function(
                    f"document.body.innerText.includes('{text}')", timeout=timeout
                )
                result = {"text": text}
            elif url:
                await self.page.wait_for_url(url, timeout=timeout)
                result = {"url": url}

            result.update(
                {
                    "success": True,
                    "current_url": self.page.url,
                }
            )
            return result
        except Exception as e:
            return {
                "error": str(e),
                "current_url": self.page.url,
            }


class PlaywrightGetText(PlaywrightBaseTool):
    """Get text content from elements"""

    @property
    def name(self) -> str:
        return "playwright_get_text"

    @property
    def description(self) -> str:
        return "Get text content from page elements using CSS selectors"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector for elements to get text from",
                },
                "all": {
                    "type": "boolean",
                    "description": "Whether to get text from all matching elements",
                    "default": False,
                },
                "inner_text": {
                    "type": "boolean",
                    "description": "Whether to get inner text (visible) or text content (all)",
                    "default": True,
                },
            },
            "required": ["selector"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the get text command"""
        selector = arguments["selector"]
        get_all = arguments.get("all", False)
        inner_text = arguments.get("inner_text", True)

        self.logger.info("Getting text", selector=selector, get_all=get_all)

        await self._ensure_playwright()

        try:
            if get_all:
                locators = self.page.locator(selector)
                count = await locators.count()
                texts = []
                for i in range(count):
                    if inner_text:
                        text = await locators.nth(i).inner_text()
                    else:
                        text = await locators.nth(i).text_content()
                    texts.append(text)
                result = {"texts": texts, "count": count}
            else:
                locator = self.page.locator(selector).first
                if inner_text:
                    text = await locator.inner_text()
                else:
                    text = await locator.text_content()
                result = {"text": text}

            result.update(
                {
                    "success": True,
                    "selector": selector,
                    "url": self.page.url,
                }
            )
            return result
        except Exception as e:
            return {
                "error": str(e),
                "selector": selector,
                "url": self.page.url,
            }


class PlaywrightFillForm(PlaywrightBaseTool):
    """Fill multiple form fields"""

    @property
    def name(self) -> str:
        return "playwright_fill_form"

    @property
    def description(self) -> str:
        return "Fill multiple form fields with values"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "fields": {
                    "type": "array",
                    "description": "Array of field objects to fill",
                    "items": {
                        "type": "object",
                        "properties": {
                            "selector": {
                                "type": "string",
                                "description": "CSS selector for the field",
                            },
                            "value": {
                                "type": "string",
                                "description": "Value to fill in the field",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["text", "select", "checkbox", "radio"],
                                "description": "Type of field",
                                "default": "text",
                            },
                        },
                        "required": ["selector", "value"],
                        "additionalProperties": False,
                    },
                },
                "submit": {
                    "type": "boolean",
                    "description": "Whether to submit the form after filling",
                    "default": False,
                },
                "submit_selector": {
                    "type": "string",
                    "description": "CSS selector for submit button",
                },
            },
            "required": ["fields"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the fill form command"""
        fields = arguments["fields"]
        submit = arguments.get("submit", False)
        submit_selector = arguments.get("submit_selector")

        self.logger.info("Filling form", field_count=len(fields))

        await self._ensure_playwright()

        try:
            filled_fields = []

            for field in fields:
                selector = field["selector"]
                value = field["value"]
                field_type = field.get("type", "text")

                locator = self.page.locator(selector)

                if field_type == "text":
                    await locator.fill(value)
                elif field_type == "select":
                    await locator.select_option(value)
                elif field_type == "checkbox":
                    if value.lower() in ["true", "1", "yes"]:
                        await locator.check()
                    else:
                        await locator.uncheck()
                elif field_type == "radio":
                    await locator.check()

                filled_fields.append(
                    {
                        "selector": selector,
                        "type": field_type,
                        "success": True,
                    }
                )

            result = {
                "success": True,
                "filled_fields": filled_fields,
                "url": self.page.url,
            }

            if submit:
                if submit_selector:
                    await self.page.locator(submit_selector).click()
                else:
                    await self.page.keyboard.press("Enter")
                result["submitted"] = True

            return result
        except Exception as e:
            return {
                "error": str(e),
                "url": self.page.url,
            }


class PlaywrightEvaluate(PlaywrightBaseTool):
    """Execute JavaScript in the browser"""

    @property
    def name(self) -> str:
        return "playwright_evaluate"

    @property
    def description(self) -> str:
        return "Execute JavaScript code in the browser and return the result"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "JavaScript expression to evaluate",
                },
                "selector": {
                    "type": "string",
                    "description": "CSS selector to evaluate expression on specific element",
                },
            },
            "required": ["expression"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the evaluate command"""
        expression = arguments["expression"]
        selector = arguments.get("selector")

        self.logger.info("Evaluating JavaScript", expression=expression[:100])

        await self._ensure_playwright()

        try:
            if selector:
                locator = self.page.locator(selector).first
                result = await locator.evaluate(expression)
            else:
                result = await self.page.evaluate(expression)

            return {
                "success": True,
                "result": result,
                "expression": expression,
                "url": self.page.url,
            }
        except Exception as e:
            return {
                "error": str(e),
                "expression": expression,
                "url": self.page.url,
            }


class PlaywrightGetPageInfo(PlaywrightBaseTool):
    """Get information about the current page"""

    @property
    def name(self) -> str:
        return "playwright_get_page_info"

    @property
    def description(self) -> str:
        return "Get comprehensive information about the current page"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "include_content": {
                    "type": "boolean",
                    "description": "Whether to include page content/HTML",
                    "default": False,
                },
                "include_cookies": {
                    "type": "boolean",
                    "description": "Whether to include cookies",
                    "default": False,
                },
            },
            "required": [],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the get page info command"""
        include_content = arguments.get("include_content", False)
        include_cookies = arguments.get("include_cookies", False)

        self.logger.info("Getting page info")

        await self._ensure_playwright()

        try:
            info = {
                "url": self.page.url,
                "title": await self.page.title(),
                "viewport": self.page.viewport_size,
            }

            if include_content:
                info["content"] = await self.page.content()

            if include_cookies:
                info["cookies"] = await self.context.cookies()

            # Get some basic page metrics
            info["metrics"] = await self.page.evaluate(
                """
                () => {
                    return {
                        documentReady: document.readyState,
                        elementCount: document.querySelectorAll('*').length,
                        linkCount: document.querySelectorAll('a').length,
                        imageCount: document.querySelectorAll('img').length,
                        formCount: document.querySelectorAll('form').length,
                    }
                }
            """
            )

            return info
        except Exception as e:
            return {
                "error": str(e),
                "url": self.page.url if self.page else None,
            }
