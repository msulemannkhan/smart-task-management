import {
  Box,
  HStack,
  IconButton,
  Divider,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { useRef, useEffect, useState } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiCode,
  FiLink,
  FiImage,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiType,
} from "react-icons/fi";
import { MdFormatListNumbered, MdFormatQuote, MdStrikethroughS } from "react-icons/md";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string | number;
  maxHeight?: string | number;
  isReadOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  minHeight = "200px",
  maxHeight = "400px",
  isReadOnly = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const toolbarBg = useColorModeValue("gray.50", "gray.700");

  // Initialize editor with value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  // Format commands
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Handle text selection
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      formatText("createLink", url);
    }
  };

  // Insert image
  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      formatText("insertImage", url);
    }
  };

  // Toolbar button component
  const ToolbarButton = ({
    icon: IconComponent,
    command,
    commandValue,
    tooltip,
    isActive = false,
  }: {
    icon: React.ElementType;
    command: string;
    commandValue?: string;
    tooltip: string;
    isActive?: boolean;
  }) => (
    <Tooltip label={tooltip} fontSize="xs">
      <IconButton
        aria-label={tooltip}
        icon={<IconComponent />}
        size="sm"
        variant={isActive ? "solid" : "ghost"}
        onClick={() => formatText(command, commandValue)}
        isDisabled={isReadOnly}
      />
    </Tooltip>
  );

  // Check if command is active
  const isCommandActive = (command: string) => {
    return document.queryCommandState(command);
  };

  if (isReadOnly) {
    return (
      <Box
        dangerouslySetInnerHTML={{ __html: value }}
        p={3}
        minH={minHeight}
        maxH={maxHeight}
        overflowY="auto"
        borderRadius="md"
        bg={bgColor}
        sx={{
          "& p": { marginBottom: "0.5em" },
          "& ul, & ol": { paddingLeft: "1.5em", marginBottom: "0.5em" },
          "& li": { marginBottom: "0.25em" },
          "& blockquote": {
            borderLeft: "3px solid",
            borderLeftColor: "gray.300",
            paddingLeft: "1em",
            marginLeft: "0",
            fontStyle: "italic",
          },
          "& code": {
            backgroundColor: useColorModeValue("gray.100", "gray.700"),
            padding: "0.2em 0.4em",
            borderRadius: "3px",
            fontSize: "0.9em",
          },
          "& a": {
            color: "blue.500",
            textDecoration: "underline",
          },
          "& img": {
            maxWidth: "100%",
            height: "auto",
            borderRadius: "md",
            marginTop: "0.5em",
            marginBottom: "0.5em",
          },
        }}
      />
    );
  }

  return (
    <Box
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
    >
      {/* Toolbar */}
      <Box bg={toolbarBg} p={2} borderBottom="1px" borderBottomColor={borderColor}>
        <HStack spacing={1} wrap="wrap">
          {/* Text Formatting */}
          <HStack spacing={0}>
            <ToolbarButton
              icon={FiBold}
              command="bold"
              tooltip="Bold (Ctrl+B)"
              isActive={isCommandActive("bold")}
            />
            <ToolbarButton
              icon={FiItalic}
              command="italic"
              tooltip="Italic (Ctrl+I)"
              isActive={isCommandActive("italic")}
            />
            <ToolbarButton
              icon={FiUnderline}
              command="underline"
              tooltip="Underline (Ctrl+U)"
              isActive={isCommandActive("underline")}
            />
            <ToolbarButton
              icon={MdStrikethroughS}
              command="strikeThrough"
              tooltip="Strikethrough"
              isActive={isCommandActive("strikeThrough")}
            />
          </HStack>

          <Divider orientation="vertical" h={6} />

          {/* Headers */}
          <HStack spacing={0}>
            <Tooltip label="Heading 1" fontSize="xs">
              <IconButton
                aria-label="Heading 1"
                icon={<Box fontSize="xs" fontWeight="bold">H1</Box>}
                size="sm"
                variant="ghost"
                onClick={() => formatText("formatBlock", "<h1>")}
                isDisabled={isReadOnly}
              />
            </Tooltip>
            <Tooltip label="Heading 2" fontSize="xs">
              <IconButton
                aria-label="Heading 2"
                icon={<Box fontSize="xs" fontWeight="bold">H2</Box>}
                size="sm"
                variant="ghost"
                onClick={() => formatText("formatBlock", "<h2>")}
                isDisabled={isReadOnly}
              />
            </Tooltip>
            <Tooltip label="Paragraph" fontSize="xs">
              <IconButton
                aria-label="Paragraph"
                icon={<FiType />}
                size="sm"
                variant="ghost"
                onClick={() => formatText("formatBlock", "<p>")}
                isDisabled={isReadOnly}
              />
            </Tooltip>
          </HStack>

          <Divider orientation="vertical" h={6} />

          {/* Lists */}
          <HStack spacing={0}>
            <ToolbarButton
              icon={FiList}
              command="insertUnorderedList"
              tooltip="Bullet List"
              isActive={isCommandActive("insertUnorderedList")}
            />
            <ToolbarButton
              icon={MdFormatListNumbered}
              command="insertOrderedList"
              tooltip="Numbered List"
              isActive={isCommandActive("insertOrderedList")}
            />
            <ToolbarButton
              icon={MdFormatQuote}
              command="formatBlock"
              commandValue="<blockquote>"
              tooltip="Quote"
            />
          </HStack>

          <Divider orientation="vertical" h={6} />

          {/* Alignment */}
          <HStack spacing={0}>
            <ToolbarButton
              icon={FiAlignLeft}
              command="justifyLeft"
              tooltip="Align Left"
              isActive={isCommandActive("justifyLeft")}
            />
            <ToolbarButton
              icon={FiAlignCenter}
              command="justifyCenter"
              tooltip="Align Center"
              isActive={isCommandActive("justifyCenter")}
            />
            <ToolbarButton
              icon={FiAlignRight}
              command="justifyRight"
              tooltip="Align Right"
              isActive={isCommandActive("justifyRight")}
            />
          </HStack>

          <Divider orientation="vertical" h={6} />

          {/* Insert */}
          <HStack spacing={0}>
            <Tooltip label="Insert Link" fontSize="xs">
              <IconButton
                aria-label="Insert Link"
                icon={<FiLink />}
                size="sm"
                variant="ghost"
                onClick={insertLink}
                isDisabled={isReadOnly}
              />
            </Tooltip>
            <Tooltip label="Insert Image" fontSize="xs">
              <IconButton
                aria-label="Insert Image"
                icon={<FiImage />}
                size="sm"
                variant="ghost"
                onClick={insertImage}
                isDisabled={isReadOnly}
              />
            </Tooltip>
            <ToolbarButton
              icon={FiCode}
              command="formatBlock"
              commandValue="<pre>"
              tooltip="Code Block"
            />
          </HStack>
        </HStack>
      </Box>

      {/* Editor */}
      <Box
        ref={editorRef}
        contentEditable={!isReadOnly}
        onInput={handleInput}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        p={3}
        minH={minHeight}
        maxH={maxHeight}
        overflowY="auto"
        bg={bgColor}
        outline="none"
        sx={{
          "&:focus": {
            boxShadow: "0 0 0 2px",
            boxShadowColor: "blue.200",
          },
          "&:empty:before": {
            content: `"${placeholder}"`,
            color: "gray.400",
          },
          "& p": { marginBottom: "0.5em" },
          "& h1": { fontSize: "2em", fontWeight: "bold", marginBottom: "0.5em" },
          "& h2": { fontSize: "1.5em", fontWeight: "bold", marginBottom: "0.5em" },
          "& ul, & ol": { paddingLeft: "1.5em", marginBottom: "0.5em" },
          "& li": { marginBottom: "0.25em" },
          "& blockquote": {
            borderLeft: "3px solid",
            borderLeftColor: "gray.300",
            paddingLeft: "1em",
            marginLeft: "0",
            fontStyle: "italic",
            color: "gray.600",
          },
          "& pre": {
            backgroundColor: useColorModeValue("gray.100", "gray.700"),
            padding: "0.5em",
            borderRadius: "md",
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: "0.9em",
          },
          "& code": {
            backgroundColor: useColorModeValue("gray.100", "gray.700"),
            padding: "0.2em 0.4em",
            borderRadius: "3px",
            fontSize: "0.9em",
            fontFamily: "monospace",
          },
          "& a": {
            color: "blue.500",
            textDecoration: "underline",
            cursor: "pointer",
          },
          "& img": {
            maxWidth: "100%",
            height: "auto",
            borderRadius: "md",
            marginTop: "0.5em",
            marginBottom: "0.5em",
          },
        }}
      />
    </Box>
  );
}