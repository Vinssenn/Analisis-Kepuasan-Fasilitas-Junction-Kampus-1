document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', e => { if (!confirm(el.dataset.confirm || 'Lanjutkan tindakan ini?')) e.preventDefault(); });
  });
  document.querySelectorAll('.rating-options input').forEach(input => {
    input.addEventListener('change', () => {
      const group = input.closest('.rating-question');
      group?.querySelectorAll('.rating-choice').forEach(label => label.classList.toggle('chosen', label.querySelector('input')?.checked));
    });
  });
  const file = document.querySelector('#csv-file');
  if (file) file.addEventListener('change', () => {
    const label = document.querySelector('#csv-name');
    if (label) label.textContent = file.files[0]?.name || 'Belum ada file dipilih';
  });
});
