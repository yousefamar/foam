---
title: <% tp.file.cursor(1) %>
public: true
date: <% tp.date.now("YYYY-MM-DD HH:mm:ss") %>
tags: <% tp.file.cursor(2) %>
---

<% tp.file.cursor(3) %>
<% await tp.file.move("/root/log/" + tp.date.now("YYYY-MM-DD-HH-mm-ss")) %>