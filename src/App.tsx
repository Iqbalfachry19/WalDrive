import { useRef, useState, ChangeEvent } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Button,
} from "@radix-ui/themes";

interface FileItem {
  name: string;
  type: string;
  blobId?: string;
  createdAt: number; // timestamp untuk Recent
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const account = useCurrentAccount();

  const [files, setFiles] = useState<FileItem[]>([
    { name: "Document1.pdf", type: "pdf", createdAt: Date.now() - 100000 },
    { name: "Photo1.png", type: "image", createdAt: Date.now() - 50000 },
    { name: "Spreadsheet1.xlsx", type: "excel", createdAt: Date.now() - 20000 },
  ]);

  const [starredFiles, setStarredFiles] = useState<FileItem[]>([]);
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<
    "my drive" | "recent" | "starred" | "trash"
  >("my drive");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "pdf" | "image" | "excel"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);

  const uploadFileDirectly = async (file: File) => {
    try {
      const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
      const params = new URLSearchParams({
        encoding_type: "RS2",
        epochs: "1",
        permanent: "false",
        force: "true",
        send_object_to: (account?.address as string) || "",
      });
      const response = await fetch(
        `${PUBLISHER}/v1/blobs?${params.toString()}`,
        {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        },
      );
      if (!response.ok) throw new Error("Failed to upload file to Walrus");
      const data = await response.json();
      const newFile: FileItem = {
        name: file.name,
        type: file.type.includes("image")
          ? "image"
          : file.type.includes("excel")
            ? "excel"
            : "pdf",
        blobId: data.id,
        createdAt: Date.now(),
      };
      setFiles((prev) => [...prev, newFile]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFileDirectly(file);
  };

  const toggleStar = (file: FileItem) => {
    if (starredFiles.includes(file)) {
      setStarredFiles((prev) => prev.filter((f) => f !== file));
    } else {
      setStarredFiles((prev) => [...prev, file]);
    }
  };

  const moveToTrash = (file: FileItem) => {
    if (!trashedFiles.includes(file)) {
      setTrashedFiles((prev) => [...prev, file]);
    }
  };

  const getVisibleFiles = () => {
    let visible: FileItem[] = [];
    switch (activeTab) {
      case "my drive":
        visible = files.filter((f) => !trashedFiles.includes(f));
        break;
      case "recent":
        visible = [...files]
          .sort((a, b) => b.createdAt - a.createdAt)
          .filter((f) => !trashedFiles.includes(f));
        break;
      case "starred":
        visible = starredFiles.filter((f) => !trashedFiles.includes(f));
        break;
      case "trash":
        visible = trashedFiles;
        break;
    }

    // filter berdasarkan search query
    visible = visible.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // filter berdasarkan advance search type
    if (filterType !== "all") {
      visible = visible.filter((f) => f.type === filterType);
    }

    return visible;
  };

  const visibleFiles = getVisibleFiles();

  return (
    <Flex direction="column" style={{ height: "100vh" }}>
      {/* Topbar */}
      <Flex
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid #ccc",
          backgroundColor: "white",
          zIndex: 1000,
        }}
      >
        <Heading size="4" color="blue">
          WalDrive
        </Heading>

        <Flex
          align="center"
          gap="2"
          style={{ flex: 1, maxWidth: "500px", margin: "0 1rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "0.25rem 0.5rem",
              backgroundColor: "#fff",
              flex: 1,
            }}
          >
            <span style={{ marginRight: "0.5rem", color: "#888" }}>🔍</span>
            <input
              type="text"
              placeholder="Search in Drive"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                color: "#000",
                backgroundColor: "transparent",
                fontSize: "14px",
              }}
            />
          </div>

          <Button size="2" variant="ghost" onClick={() => setIsModalOpen(true)}>
            Advance Search
          </Button>
        </Flex>

        <Flex align="center" gap="2">
          <ConnectButton />
        </Flex>
      </Flex>

      {/* Sidebar */}
      <Flex style={{ flex: 1, overflow: "hidden" }}>
        <Box
          style={{
            width: "250px",
            borderRight: "1px solid #ccc",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
          }}
        >
          <Text size="2" style={{ fontWeight: "bold", marginBottom: "1rem" }}>
            My Drive
          </Text>

          {/* Tombol New */}
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <Button
              variant="solid"
              size="2"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setIsNewDropdownOpen((prev) => !prev)}
            >
              + New <span style={{ fontSize: "12px" }}>▼</span>
            </Button>
            {isNewDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  borderRadius: "4px",
                  width: "100%",
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    color: "black",
                  }}
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsNewDropdownOpen(false);
                  }}
                >
                  Upload File
                </div>
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    color: "black",
                  }}
                  onClick={() => {
                    alert("Create Folder clicked");
                    setIsNewDropdownOpen(false);
                  }}
                >
                  Create Folder
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          {(["my drive", "recent", "starred", "trash"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "solid" : "ghost"}
              size="2"
              style={{ width: "100%", marginBottom: "0.5rem" }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </Box>

        {/* Main content */}
        <Container
          size="4"
          style={{
            padding: "1rem",
            overflowY: "auto",
            flex: 1,
            borderRadius: "8px",
            position: "relative",
            backgroundColor: "#fff", // ubah jadi putih
            color: "#000", // tulisan hitam
            border: "1px solid #ccc", // border tipis abu-abu lebih rapi
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFiles = Array.from(e.dataTransfer.files);
            droppedFiles.forEach(uploadFileDirectly);
          }}
        >
          <Flex justify="between" align="center" mb="4">
            <Heading size="7">
              {activeTab === "trash" ? "Trash" : "My Drive"}
            </Heading>
          </Flex>

          <Flex wrap="wrap" gap="3" mb="6">
            {visibleFiles.map((file, idx) => (
              <Card
                key={idx}
                variant="surface"
                style={{
                  width: "150px",
                  height: "150px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <Text size="3" style={{ marginBottom: "0.5rem" }}>
                  {file.type === "pdf" && "📄"}
                  {file.type === "image" && "🖼️"}
                  {file.type === "excel" && "📊"}
                </Text>
                <Text size="2" style={{ textAlign: "center" }}>
                  {file.name}
                </Text>
                {file.blobId && (
                  <Text
                    size="1"
                    style={{ marginTop: "0.5rem", wordBreak: "break-word" }}
                  >
                    {file.blobId}
                  </Text>
                )}

                {/* Dropdown titik tiga */}
                <div style={{ position: "absolute", top: "5px", right: "5px" }}>
                  <Button
                    size="1"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === idx ? null : idx);
                    }}
                  >
                    ⋮
                  </Button>
                  {openDropdownId === idx && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        backgroundColor: "#fff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        borderRadius: "4px",
                        zIndex: 100,
                        width: "120px",
                      }}
                    >
                      <div
                        style={{ padding: "0.5rem", cursor: "pointer" }}
                        onClick={() => {
                          moveToTrash(file);
                          setOpenDropdownId(null);
                        }}
                      >
                        Delete
                      </div>
                      <div
                        style={{ padding: "0.5rem", cursor: "pointer" }}
                        onClick={() => {
                          toggleStar(file);
                          setOpenDropdownId(null);
                        }}
                      >
                        {starredFiles.includes(file) ? "Unstarred" : "Starred"}
                      </div>
                      <div
                        style={{ padding: "0.5rem", cursor: "pointer" }}
                        onClick={() => {
                          alert(`Share ${file.name}`);
                          setOpenDropdownId(null);
                        }}
                      >
                        Share
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </Flex>
        </Container>
      </Flex>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      {/* Advance Search Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "1.5rem",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <Heading size="3" style={{ marginBottom: "1rem" }}>
              Advance Search
            </Heading>

            <label>
              File Type:
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <option value="all">All</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="excel">Excel</option>
              </select>
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <Button
                variant="solid"
                size="2"
                onClick={() => setIsModalOpen(false)}
              >
                Search
              </Button>
              <Button
                variant="ghost"
                size="2"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
}

export default App;
