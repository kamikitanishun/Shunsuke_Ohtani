fetch('links.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('links-container');
    container.innerHTML = '';

    data.forEach(link => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';

      const a = document.createElement('a');
      a.className = 'link-content';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const title = document.createElement('span');
      title.className = 'link-title';
      title.textContent = link.title;

      const description = document.createElement('span');
      description.className = 'link-description';

      const prefix = link.description.replace(link.accent, '').trimEnd();
      const accent = document.createElement('span');
      accent.className = `link-accent link-accent-${link.accentType}`;
      accent.textContent = link.accent;

      description.append(prefix, ' ', accent);

      a.appendChild(title);
      a.appendChild(description);
      linkItem.appendChild(a);
      container.appendChild(linkItem);
    });
  })
  .catch(error => {
    document.getElementById('links-container').textContent = 'リンクの読み込みに失敗しました。';
    console.error('リンク読み込みエラー:', error);
  });
