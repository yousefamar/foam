---
title: <% tp.file.cursor(1) %>
public: true
listed: true
log: true
---

<% tp.file.cursor(2) %>
<% await tp.file.move("/root/projects/" + tp.file.title + "/index") %>